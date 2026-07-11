import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import {
  Tenant, Store, CreateStoreRequest,
  AccessKey, BucketMapping,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  private url(path: string) {
    return `${this.config.apiUrl()}${path}`;
  }

  // Tenants
  listTenants() {
    return this.http.get<Tenant[]>(this.url('/tenants'));
  }

  createTenant(name: string) {
    return this.http.post<Tenant>(this.url('/tenants'), { name });
  }

  getTenant(id: string) {
    return this.http.get<Tenant>(this.url(`/tenants/${id}`));
  }

  // Access keys
  createKey(tenantId: string, readonly = false) {
    return this.http.post<AccessKey>(this.url(`/tenants/${tenantId}/keys`), { readonly });
  }

  setKeyReadonly(tenantId: string, keyId: string, readonly: boolean) {
    return this.http.put<AccessKey>(this.url(`/tenants/${tenantId}/keys/${keyId}/readonly`), { readonly });
  }

  listKeys(tenantId: string) {
    return this.http.get<AccessKey[]>(this.url(`/tenants/${tenantId}/keys`));
  }

  revokeKey(tenantId: string, keyId: string) {
    return this.http.delete(this.url(`/tenants/${tenantId}/keys/${keyId}`));
  }

  // Stores
  createStore(tenantId: string, body: CreateStoreRequest) {
    return this.http.post<Store>(this.url(`/tenants/${tenantId}/stores`), body);
  }

  listStores(tenantId: string) {
    return this.http.get<Store[]>(this.url(`/tenants/${tenantId}/stores`));
  }

  getStore(tenantId: string, storeId: string) {
    return this.http.get<Store>(this.url(`/tenants/${tenantId}/stores/${storeId}`));
  }

  updateBackend(tenantId: string, storeId: string, body: { backend_config: Record<string, unknown>; presigned_mode?: string }) {
    return this.http.put(this.url(`/tenants/${tenantId}/stores/${storeId}/backend`), body);
  }

  deleteStore(tenantId: string, storeId: string) {
    return this.http.delete(this.url(`/tenants/${tenantId}/stores/${storeId}`));
  }

  getCors(tenantId: string, storeId: string) {
    return this.http.get<{ allowed_origins: string[] }>(this.url(`/tenants/${tenantId}/stores/${storeId}/cors`));
  }

  updateCors(tenantId: string, storeId: string, origins: string[]) {
    return this.http.put(this.url(`/tenants/${tenantId}/stores/${storeId}/cors`), { allowed_origins: origins });
  }

  // Bucket mappings
  createBucket(tenantId: string, storeId: string, gateway_bucket: string, backend_bucket: string) {
    return this.http.post<BucketMapping>(
      this.url(`/tenants/${tenantId}/stores/${storeId}/buckets`),
      { gateway_bucket, backend_bucket },
    );
  }

  listBuckets(tenantId: string, storeId: string) {
    return this.http.get<BucketMapping[]>(this.url(`/tenants/${tenantId}/stores/${storeId}/buckets`));
  }

  deleteBucket(tenantId: string, storeId: string, mappingId: string) {
    return this.http.delete(this.url(`/tenants/${tenantId}/stores/${storeId}/buckets/${mappingId}`));
  }

  // Health (probe endpoints)
  healthAdmin() {
    return this.http.get(this.url('/healthz'), { observe: 'response' });
  }
}
