import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import {
  BrowseObject, BrowseObjectMetadata, ListObjectsResponse,
  PresignResponse, FolderSizeEvent,
} from '../models';

@Injectable({ providedIn: 'root' })
export class FileBrowserService {
  private http   = inject(HttpClient);
  private config = inject(ConfigService);

  private adminUrl(tenantId: string, storeId: string, mappingId: string, sub = '') {
    return `${this.config.apiUrl()}/tenants/${tenantId}/stores/${storeId}/buckets/${mappingId}/browse${sub}`;
  }

  listObjects(
    tenantId: string, storeId: string, mappingId: string,
    params: { prefix?: string; delimiter?: string; max_keys?: number; continuation_token?: string },
  ): Observable<ListObjectsResponse> {
    let p = new HttpParams();
    if (params.prefix)                  p = p.set('prefix', params.prefix);
    if (params.delimiter !== undefined) p = p.set('delimiter', params.delimiter);
    if (params.max_keys)                p = p.set('max_keys', params.max_keys);
    if (params.continuation_token)      p = p.set('continuation_token', params.continuation_token);
    return this.http.get<ListObjectsResponse>(
      this.adminUrl(tenantId, storeId, mappingId), { params: p },
    );
  }

  getMetadata(
    tenantId: string, storeId: string, mappingId: string, key: string,
  ): Observable<BrowseObjectMetadata> {
    return this.http.get<BrowseObjectMetadata>(
      this.adminUrl(tenantId, storeId, mappingId, '/metadata'),
      { params: new HttpParams().set('key', key) },
    );
  }

  presign(
    tenantId: string, storeId: string, mappingId: string,
    key: string, expiresIn = 3600,
  ): Observable<PresignResponse> {
    return this.http.post<PresignResponse>(
      this.adminUrl(tenantId, storeId, mappingId, '/presign'),
      { key, expires_in: expiresIn },
    );
  }

  // Uses fetch instead of EventSource so the Authorization header can be sent.
  sizeStream(
    tenantId: string, storeId: string, mappingId: string, prefix: string,
  ): Observable<FolderSizeEvent> {
    return new Observable<FolderSizeEvent>(observer => {
      const url = `${this.adminUrl(tenantId, storeId, mappingId, '/size-stream')}?prefix=${encodeURIComponent(prefix)}`;
      const token = this.config.adminToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const controller = new AbortController();

      fetch(url, { headers, signal: controller.signal })
        .then(response => {
          if (!response.ok) { observer.error(new Error(`HTTP ${response.status}`)); return; }
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          const read = (): void => {
            reader.read().then(({ done, value }) => {
              if (done) { observer.complete(); return; }
              buffer += decoder.decode(value, { stream: true });
              // SSE messages are separated by double newlines
              const parts = buffer.split('\n\n');
              buffer = parts.pop() ?? '';
              for (const message of parts) {
                let eventType = 'message';
                let dataStr = '';
                for (const line of message.split('\n')) {
                  if (line.startsWith('event:')) eventType = line.slice(6).trim();
                  else if (line.startsWith('data:')) dataStr = line.slice(5).trim();
                }
                if (!dataStr) continue;
                try {
                  const data: FolderSizeEvent = JSON.parse(dataStr);
                  if (eventType === 'error') { observer.error(new Error(data.error ?? 'stream error')); return; }
                  observer.next(data);
                  if (eventType === 'done') { observer.complete(); return; }
                } catch { /* ignore malformed lines */ }
              }
              read();
            }).catch(err => {
              if (err.name !== 'AbortError') observer.error(err);
              else observer.complete();
            });
          };
          read();
        })
        .catch(err => {
          if (err.name !== 'AbortError') observer.error(err);
          else observer.complete();
        });

      return () => controller.abort();
    });
  }
}
