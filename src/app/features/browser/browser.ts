import { Component, OnInit, inject, input, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FileBrowserService } from '../../core/services/file-browser.service';
import { ToastService } from '../../core/services/toast.service';
import {
  BrowserEntry, BrowseObject, BrowseObjectMetadata,
} from '../../core/models';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-browser',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe],
  styles: [`
    :host { display: contents; }

    /* ── Page layout ────────────────────────────────────────────── */
    .browser-page {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: var(--color-bg);
    }

    /* ── Top bar ────────────────────────────────────────────────── */
    .top-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 24px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;

      .back-btn {
        display: inline-flex; align-items: center; gap: 4px;
        color: var(--color-text-muted); font-size: 12px; cursor: pointer;
        padding: 4px 8px; border-radius: var(--r-md);
        transition: background .15s, color .15s;
        &:hover { background: var(--color-border); color: var(--color-text); }
        .material-symbols-rounded { font-size: 16px; }
      }

      .divider { width: 1px; height: 20px; background: var(--color-border); }

      .bucket-identity {
        display: flex; align-items: center; gap: 10px;
        .bucket-icon {
          width: 32px; height: 32px; border-radius: var(--r-md);
          background: var(--color-secondary-light); color: var(--color-secondary);
          display: flex; align-items: center; justify-content: center;
          .material-symbols-rounded { font-size: 18px; }
        }
        .bucket-name { font-size: 15px; font-weight: 700; }
      }

      .spacer { flex: 1; }

      .stats {
        font-size: 12px; color: var(--color-text-muted);
        span { font-weight: 600; color: var(--color-text); }
      }
    }

    /* ── Toolbar (breadcrumb + search) ──────────────────────────── */
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 24px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 2px;
      flex: 1;
      min-width: 0;
      overflow: hidden;

      .crumb-root, .crumb-seg {
        display: inline-flex; align-items: center; gap: 3px;
        padding: 3px 7px; border-radius: var(--r-md);
        font-size: 13px; font-weight: 500; cursor: pointer;
        white-space: nowrap; transition: background .12s;
        &:hover { background: var(--color-border); }
        &.active { color: var(--color-text); font-weight: 700; cursor: default; }
        &.active:hover { background: transparent; }
        .material-symbols-rounded { font-size: 16px; }
      }

      .crumb-root { color: var(--color-secondary); }
      .crumb-sep { color: var(--color-text-muted); font-size: 14px; user-select: none; }
    }

    .search-box {
      position: relative;
      width: 220px;
      flex-shrink: 0;

      .material-symbols-rounded {
        position: absolute; left: 8px; top: 50%; transform: translateY(-50%);
        font-size: 16px; color: var(--color-text-muted); pointer-events: none;
      }

      input {
        width: 100%; padding: 6px 10px 6px 30px;
        border: 1.5px solid var(--color-border); border-radius: var(--r-md);
        font-size: 13px; outline: none; transition: border-color .15s;
        &:focus { border-color: var(--color-secondary); }
        &::placeholder { color: #aab4be; }
      }
    }

    /* ── Main content area ──────────────────────────────────────── */
    .content-area {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    /* ── File list pane ─────────────────────────────────────────── */
    .file-list-pane {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .file-table-wrap {
      flex: 1;
      overflow-y: auto;
    }

    .file-table {
      width: 100%;
      border-collapse: collapse;

      thead th {
        position: sticky; top: 0; z-index: 1;
        background: var(--color-bg);
        padding: 8px 12px;
        font-size: 11px; font-weight: 700; text-transform: uppercase;
        letter-spacing: .05em; color: var(--color-text-muted);
        text-align: left; border-bottom: 1px solid var(--color-border);
        white-space: nowrap;
        &.col-name  { width: 99%; }
        &.col-size  { min-width: 90px; }
        &.col-date  { min-width: 140px; }
        &.col-act   { min-width: 50px; }
      }

      tbody tr {
        cursor: pointer;
        transition: background .1s;
        &:hover td { background: var(--color-surface-low); }
        &.selected td { background: var(--color-secondary-light); }

        td {
          padding: 9px 12px;
          border-bottom: 1px solid var(--color-border);
          font-size: 13px; vertical-align: middle;
          &:last-child { border-bottom: none; }
        }
        &:last-child td { border-bottom: none; }
      }
    }

    .entry-name {
      display: flex; align-items: center; gap: 8px;
      .icon { font-size: 18px; line-height: 1; flex-shrink: 0; }
      .icon-folder   { color: #f59e0b; }
      .icon-image    { color: #10b981; }
      .icon-pdf      { color: #ef4444; }
      .icon-code     { color: #6366f1; }
      .icon-archive  { color: #8b5cf6; }
      .icon-media    { color: #ec4899; }
      .icon-data     { color: #0ea5e9; }
      .icon-file     { color: #6b7280; }
      .name-text {
        font-weight: 500;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .folder-text { color: var(--color-secondary); }
    }

    .size-cell { font-family: var(--font-mono); font-size: 12px; color: var(--color-text-muted); }
    .date-cell { font-size: 12px; color: var(--color-text-muted); white-space: nowrap; }

    .row-actions {
      display: flex; gap: 4px; opacity: 0; transition: opacity .15s;
    }
    tr:hover .row-actions, tr.selected .row-actions { opacity: 1; }

    .icon-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: var(--r-md);
      color: var(--color-text-muted); cursor: pointer; transition: background .12s, color .12s;
      .material-symbols-rounded { font-size: 16px; }
      &:hover { background: rgba(0,0,0,.07); color: var(--color-text); }
    }

    /* ── Footer: load-more ──────────────────────────────────────── */
    .list-footer {
      padding: 12px 24px;
      border-top: 1px solid var(--color-border);
      background: var(--color-surface);
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    /* ── Empty / loading states ─────────────────────────────────── */
    .state-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 12px;
      color: var(--color-text-muted);
      padding: 64px 24px;

      .material-symbols-rounded { font-size: 48px; opacity: .2; }
      p { font-size: 13px; }
    }

    /* ── Detail panel ───────────────────────────────────────────── */
    .detail-panel {
      width: 300px;
      flex-shrink: 0;
      border-left: 1px solid var(--color-border);
      background: var(--color-surface);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--color-border);

      .panel-title {
        font-size: 13px; font-weight: 700;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        flex: 1; min-width: 0;
      }
    }

    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .panel-preview {
      display: flex; align-items: center; justify-content: center;
      height: 120px; border-radius: var(--r-md);
      background: var(--color-bg); border: 1px solid var(--color-border);
      margin-bottom: 16px;
      .material-symbols-rounded { font-size: 48px; color: var(--color-text-muted); opacity: .4; }
    }

    .meta-grid {
      display: flex; flex-direction: column; gap: 10px;
      margin-bottom: 16px;
    }

    .meta-item {
      .meta-label {
        font-size: 10px; font-weight: 700; text-transform: uppercase;
        letter-spacing: .05em; color: var(--color-text-muted); margin-bottom: 2px;
      }
      .meta-value {
        font-size: 13px; color: var(--color-text); word-break: break-all;
        &.mono { font-family: var(--font-mono); font-size: 11px; }
      }
    }

    .user-meta-section {
      margin-top: 4px; margin-bottom: 16px;
      .section-label {
        font-size: 10px; font-weight: 700; text-transform: uppercase;
        letter-spacing: .05em; color: var(--color-text-muted); margin-bottom: 8px;
      }
      .user-meta-pair {
        display: flex; align-items: baseline; gap: 6px;
        font-size: 12px; padding: 4px 0;
        border-bottom: 1px solid var(--color-border);
        &:last-child { border-bottom: none; }
        .umk { font-weight: 600; color: var(--color-text-muted); flex-shrink: 0; }
        .umv { word-break: break-all; }
      }
    }

    .presign-section {
      border-top: 1px solid var(--color-border);
      padding-top: 14px;
    }

    .presign-url-box {
      margin-top: 10px;
      padding: 10px 12px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--r-md);
      font-family: var(--font-mono);
      font-size: 10px;
      word-break: break-all;
      color: var(--color-text-muted);
      line-height: 1.5;
    }

    .presign-expiry {
      font-size: 11px; color: var(--color-text-muted); margin-top: 6px;
    }

    .panel-actions {
      display: flex; flex-direction: column; gap: 6px;
      margin-top: 8px;
    }

    /* ── Size stream overlay ────────────────────────────────────── */
    .size-stream-bar {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 24px;
      background: var(--color-info-bg);
      border-bottom: 1px solid var(--color-secondary-light);
      font-size: 12px; color: var(--color-info);
      flex-shrink: 0;
      .material-symbols-rounded { font-size: 16px; animation: spin .8s linear infinite; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
  template: `
    <div class="browser-page">

      <!-- Top bar -->
      <div class="top-bar">
        <a class="back-btn" [routerLink]="['/tenants', tenantId()]">
          <span class="material-symbols-rounded">arrow_back</span>
          Back
        </a>
        <div class="divider"></div>
        <div class="bucket-identity">
          <div class="bucket-icon">
            <span class="material-symbols-rounded">storage</span>
          </div>
          <span class="bucket-name">{{ bucketDisplayName() }}</span>
        </div>
        <div class="spacer"></div>
        <div class="stats">
          <span>{{ entries().length }}</span> items loaded
          @if (isTruncated()) { &nbsp;· more available }
        </div>
      </div>

      <!-- Folder size stream progress -->
      @if (streamingSize()) {
        <div class="size-stream-bar">
          <span class="material-symbols-rounded">sync</span>
          Counting… {{ sizeStreamResult().scanned }} objects &mdash;
          {{ formatSize(sizeStreamResult().total_bytes) }} so far
        </div>
      }

      <!-- Toolbar: breadcrumb + search -->
      <div class="toolbar">
        <nav class="breadcrumb">
          <span class="crumb-root" [class.active]="!currentPrefix()" (click)="navigateTo('')">
            <span class="material-symbols-rounded">storage</span>
            {{ bucketDisplayName() }}
          </span>
          @for (seg of pathSegments(); track seg.prefix; let last = $last) {
            <span class="crumb-sep">›</span>
            <span class="crumb-seg" [class.active]="last" (click)="!last && navigateTo(seg.prefix)">
              {{ seg.name }}
            </span>
          }
        </nav>

        <div class="search-box">
          <span class="material-symbols-rounded">search</span>
          <input [ngModel]="filterText()" (ngModelChange)="filterText.set($event)"
                 placeholder="Filter names…" />
        </div>
      </div>

      <!-- Content area -->
      <div class="content-area">

        <!-- File list pane -->
        <div class="file-list-pane">

          @if (loading()) {
            <div class="state-wrap">
              <div class="spinner" style="width:32px;height:32px;border-width:3px"></div>
              <p>Loading objects…</p>
            </div>
          } @else if (filteredEntries().length === 0) {
            <div class="state-wrap">
              <span class="material-symbols-rounded">folder_open</span>
              <p>{{ filterText() ? 'No items match your filter' : 'This directory is empty' }}</p>
              @if (filterText()) {
                <button class="btn btn-ghost btn-sm" (click)="filterText.set('')">Clear filter</button>
              }
            </div>
          } @else {
            <div class="file-table-wrap">
              <table class="file-table">
                <thead>
                  <tr>
                    <th class="col-name">Name</th>
                    <th class="col-size">Size</th>
                    <th class="col-date">Last Modified</th>
                    <th class="col-act"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (entry of filteredEntries(); track entry.name) {
                    <tr [class.selected]="selectedObject()?.key === entry.object?.key"
                        (click)="onRowClick(entry)">
                      <td>
                        <div class="entry-name">
                          @if (entry.type === 'folder') {
                            <span class="material-symbols-rounded icon icon-folder icon-filled">folder</span>
                            <span class="name-text folder-text">{{ entry.name }}/</span>
                          } @else {
                            <span class="material-symbols-rounded icon {{ fileIconClass(entry.name) }}">
                              {{ fileIcon(entry.name) }}
                            </span>
                            <span class="name-text">{{ entry.name }}</span>
                          }
                        </div>
                      </td>
                      <td class="size-cell">
                        @if (entry.type === 'file' && entry.object) {
                          {{ formatSize(entry.object.size) }}
                        } @else {
                          <span style="color:var(--color-border)">—</span>
                        }
                      </td>
                      <td class="date-cell">
                        @if (entry.type === 'file' && entry.object) {
                          {{ entry.object.last_modified | date:'d MMM yyyy, HH:mm' }}
                        } @else {
                          <span style="color:var(--color-border)">—</span>
                        }
                      </td>
                      <td>
                        <div class="row-actions">
                          @if (entry.type === 'folder') {
                            <span class="icon-btn" title="Count folder size" (click)="$event.stopPropagation(); countFolderSize(entry)">
                              <span class="material-symbols-rounded">data_usage</span>
                            </span>
                          } @else {
                            <span class="icon-btn" title="Download" (click)="$event.stopPropagation(); quickDownload(entry)">
                              <span class="material-symbols-rounded">download</span>
                            </span>
                            <span class="icon-btn" title="Copy path" (click)="$event.stopPropagation(); copyPath(entry)">
                              <span class="material-symbols-rounded">content_copy</span>
                            </span>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- Footer -->
          @if (!loading() && (isTruncated() || loadingMore())) {
            <div class="list-footer">
              @if (loadingMore()) {
                <div class="spinner"></div>
                <span style="font-size:13px;color:var(--color-text-muted)">Loading more…</span>
              } @else {
                <button class="btn btn-secondary btn-sm" (click)="loadMore()">
                  <span class="material-symbols-rounded" style="font-size:16px">expand_more</span>
                  Load {{ PAGE_SIZE }} more
                </button>
                <span style="font-size:12px;color:var(--color-text-muted)">
                  Showing {{ entries().length }} items
                </span>
              }
            </div>
          }

        </div>

        <!-- Detail panel -->
        @if (selectedObject()) {
          <aside class="detail-panel">
            <div class="panel-header">
              <span class="panel-title">{{ selectedObject()!.key.split('/').pop() }}</span>
              <button class="btn btn-ghost btn-sm" style="padding:4px" (click)="closePanel()">
                <span class="material-symbols-rounded" style="font-size:16px">close</span>
              </button>
            </div>
            <div class="panel-body">

              <!-- Preview icon -->
              <div class="panel-preview">
                <span class="material-symbols-rounded" style="font-size:52px;opacity:.2;color:var(--color-secondary)">
                  {{ fileIcon(selectedObject()!.key.split('/').pop()!) }}
                </span>
              </div>

              @if (loadingMetadata()) {
                <div style="display:flex;align-items:center;gap:8px;color:var(--color-text-muted);font-size:13px;margin-bottom:16px">
                  <div class="spinner"></div> Loading metadata…
                </div>
              }

              <!-- Core metadata -->
              <div class="meta-grid">
                <div class="meta-item">
                  <div class="meta-label">Key</div>
                  <div class="meta-value mono">{{ selectedObject()!.key }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Size</div>
                  <div class="meta-value">
                    {{ formatSize(selectedObject()!.size) }}
                    <span style="color:var(--color-text-muted);font-size:11px">
                      ({{ selectedObject()!.size | number }} bytes)
                    </span>
                  </div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Last Modified</div>
                  <div class="meta-value">{{ selectedObject()!.last_modified | date:'d MMM yyyy, HH:mm:ss' }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">ETag</div>
                  <div class="meta-value mono">{{ selectedObject()!.etag }}</div>
                </div>
                @if (metadata()) {
                  <div class="meta-item">
                    <div class="meta-label">Content Type</div>
                    <div class="meta-value mono">{{ metadata()!.content_type }}</div>
                  </div>
                  @if (metadata()!.storage_class) {
                    <div class="meta-item">
                      <div class="meta-label">Storage Class</div>
                      <div class="meta-value">{{ metadata()!.storage_class }}</div>
                    </div>
                  }
                }
              </div>

              <!-- User metadata -->
              @if (metadata() && userMetaEntries().length > 0) {
                <div class="user-meta-section">
                  <div class="section-label">User Metadata</div>
                  @for (pair of userMetaEntries(); track pair.key) {
                    <div class="user-meta-pair">
                      <span class="umk">{{ pair.key }}</span>
                      <span class="umv">{{ pair.value }}</span>
                    </div>
                  }
                </div>
              }

              <!-- Presign / download -->
              <div class="presign-section">
                <div class="panel-actions">
                  <button class="btn btn-primary btn-sm" [disabled]="loadingPresign()"
                          (click)="requestPresign()">
                    @if (loadingPresign()) { <div class="spinner" style="width:14px;height:14px;border-width:2px"></div> }
                    @else { <span class="material-symbols-rounded" style="font-size:14px">link</span> }
                    Generate Download URL
                  </button>

                  @if (presignUrl()) {
                    <button class="btn btn-ghost btn-sm" (click)="openPresignUrl()">
                      <span class="material-symbols-rounded" style="font-size:14px">open_in_new</span>
                      Open in new tab
                    </button>
                    <button class="btn btn-ghost btn-sm" (click)="copyPresignUrl()">
                      <span class="material-symbols-rounded" style="font-size:14px">content_copy</span>
                      Copy URL
                    </button>
                  }
                </div>

                @if (presignUrl()) {
                  <div class="presign-url-box">{{ presignUrl() }}</div>
                  @if (presignExpires()) {
                    <div class="presign-expiry">
                      Expires {{ presignExpires() | date:'d MMM yyyy, HH:mm' }}
                    </div>
                  }
                }
              </div>

            </div>
          </aside>
        }

      </div><!-- /content-area -->
    </div><!-- /browser-page -->
  `,
})
export class BrowserComponent implements OnInit {
  private browser = inject(FileBrowserService);
  private toast   = inject(ToastService);

  // Route params bound via withComponentInputBinding
  tenantId  = input.required<string>();
  storeId   = input.required<string>();
  mappingId = input.required<string>();
  bucket    = input<string>('');

  readonly PAGE_SIZE = PAGE_SIZE;

  // ── State ──────────────────────────────────────────────────────
  currentPrefix = signal('');
  entries       = signal<BrowserEntry[]>([]);
  loading       = signal(false);
  loadingMore   = signal(false);
  isTruncated   = signal(false);
  nextToken     = signal<string | null>(null);
  filterText    = signal('');

  selectedObject   = signal<BrowseObject | null>(null);
  metadata         = signal<BrowseObjectMetadata | null>(null);
  loadingMetadata  = signal(false);

  presignUrl     = signal<string | null>(null);
  presignExpires = signal<string | null>(null);
  loadingPresign = signal(false);

  streamingSize     = signal(false);
  sizeStreamResult  = signal<{ scanned: number; total_bytes: number }>({ scanned: 0, total_bytes: 0 });

  // ── Computed ───────────────────────────────────────────────────
  bucketDisplayName = computed(() => this.bucket() || this.mappingId().slice(0, 8) + '…');

  pathSegments = computed(() => {
    const parts = this.currentPrefix().replace(/\/$/, '').split('/').filter(Boolean);
    return parts.map((name, i) => ({
      name,
      prefix: parts.slice(0, i + 1).join('/') + '/',
    }));
  });

  filteredEntries = computed(() => {
    const filter = this.filterText().toLowerCase();
    const all    = this.entries();
    const list   = filter ? all.filter(e => e.name.toLowerCase().includes(filter)) : all;
    // Folders always sorted before files
    return [
      ...list.filter(e => e.type === 'folder').sort((a, b) => a.name.localeCompare(b.name)),
      ...list.filter(e => e.type === 'file').sort((a, b) => a.name.localeCompare(b.name)),
    ];
  });

  userMetaEntries = computed(() => {
    const m = this.metadata();
    if (!m) return [];
    return Object.entries(m.user_metadata).map(([key, value]) => ({ key, value }));
  });

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit() {
    this.loadEntries(true);
  }

  // ── Navigation ─────────────────────────────────────────────────
  navigateTo(prefix: string) {
    this.currentPrefix.set(prefix);
    this.filterText.set('');
    this.closePanel();
    this.streamingSize.set(false);
    this.loadEntries(true);
  }

  onRowClick(entry: BrowserEntry) {
    if (entry.type === 'folder') {
      this.navigateTo(entry.prefix!);
    } else {
      this.selectFile(entry.object!);
    }
  }

  // ── Data loading ───────────────────────────────────────────────
  private loadEntries(replace: boolean) {
    this.loading.set(replace);
    this.loadingMore.set(!replace);

    if (replace) {
      this.entries.set([]);
      this.nextToken.set(null);
      this.isTruncated.set(false);
    }

    this.browser.listObjects(this.tenantId(), this.storeId(), this.mappingId(), {
      prefix:             this.currentPrefix(),
      delimiter:          '/',
      max_keys:           PAGE_SIZE,
      continuation_token: replace ? undefined : (this.nextToken() ?? undefined),
    }).subscribe({
      next: (res) => {
        const prefix  = this.currentPrefix();
        const newEntries: BrowserEntry[] = [
          ...res.common_prefixes.map(p => ({
            type:   'folder' as const,
            name:   p.slice(prefix.length).replace(/\/$/, ''),
            prefix: p,
          })),
          ...res.objects.map(o => ({
            type:   'file' as const,
            name:   o.key.slice(prefix.length),
            object: o,
          })),
        ];

        this.entries.update(prev => replace ? newEntries : [...prev, ...newEntries]);
        this.isTruncated.set(res.is_truncated);
        this.nextToken.set(res.next_continuation_token);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadingMore.set(false);
        this.toast.error(`Failed to list objects: ${err.message ?? err}`);
      },
    });
  }

  loadMore() {
    this.loadEntries(false);
  }

  // ── File selection ─────────────────────────────────────────────
  selectFile(obj: BrowseObject) {
    this.selectedObject.set(obj);
    this.metadata.set(null);
    this.presignUrl.set(null);
    this.presignExpires.set(null);
    this.loadingMetadata.set(true);

    this.browser.getMetadata(this.tenantId(), this.storeId(), this.mappingId(), obj.key).subscribe({
      next:  (m) => { this.metadata.set(m); this.loadingMetadata.set(false); },
      error: ()  => { this.loadingMetadata.set(false); },
    });
  }

  closePanel() {
    this.selectedObject.set(null);
    this.metadata.set(null);
    this.presignUrl.set(null);
    this.presignExpires.set(null);
  }

  // ── Presign ────────────────────────────────────────────────────
  requestPresign() {
    const obj = this.selectedObject();
    if (!obj) return;
    this.loadingPresign.set(true);
    this.presignUrl.set(null);

    this.browser.presign(this.tenantId(), this.storeId(), this.mappingId(), obj.key).subscribe({
      next: (res) => {
        this.presignUrl.set(res.url);
        this.presignExpires.set(res.expires_at);
        this.loadingPresign.set(false);
      },
      error: () => {
        this.loadingPresign.set(false);
        this.toast.error('Failed to generate download URL');
      },
    });
  }

  openPresignUrl() {
    const url = this.presignUrl();
    if (url) window.open(url, '_blank');
  }

  copyPresignUrl() {
    const url = this.presignUrl();
    if (url) navigator.clipboard.writeText(url)
      .then(() => this.toast.info('Download URL copied'));
  }

  // ── Quick row actions ──────────────────────────────────────────
  quickDownload(entry: BrowserEntry) {
    if (!entry.object) return;
    this.selectFile(entry.object);
    // Auto-trigger presign after metadata loads (slight delay)
    setTimeout(() => this.requestPresign(), 500);
  }

  copyPath(entry: BrowserEntry) {
    const key = entry.object?.key ?? entry.prefix ?? '';
    navigator.clipboard.writeText(key).then(() => this.toast.info('Path copied'));
  }

  countFolderSize(entry: BrowserEntry) {
    if (!entry.prefix) return;
    this.streamingSize.set(true);
    this.sizeStreamResult.set({ scanned: 0, total_bytes: 0 });

    this.browser.sizeStream(this.tenantId(), this.storeId(), this.mappingId(), entry.prefix).subscribe({
      next:     (ev) => this.sizeStreamResult.set({ scanned: ev.scanned, total_bytes: ev.total_bytes }),
      error:    ()   => { this.streamingSize.set(false); this.toast.error('Size count failed'); },
      complete: ()   => {
        this.streamingSize.set(false);
        const r = this.sizeStreamResult();
        this.toast.info(`${entry.name}/: ${r.scanned} objects, ${this.formatSize(r.total_bytes)}`);
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────
  formatSize(bytes: number): string {
    if (bytes < 1_024)             return `${bytes} B`;
    if (bytes < 1_048_576)         return `${(bytes / 1_024).toFixed(1)} KB`;
    if (bytes < 1_073_741_824)     return `${(bytes / 1_048_576).toFixed(1)} MB`;
    return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  }

  fileIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = {
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image',
      pdf: 'picture_as_pdf',
      json: 'data_object', xml: 'code', yaml: 'code', yml: 'code', toml: 'code',
      html: 'html', htm: 'html', css: 'css', js: 'javascript', ts: 'javascript',
      md: 'description', txt: 'description', csv: 'table_chart',
      zip: 'folder_zip', gz: 'folder_zip', tar: 'folder_zip', bz2: 'folder_zip',
      mp4: 'videocam', mov: 'videocam', mp3: 'audio_file', wav: 'audio_file',
      pptx: 'slideshow', docx: 'article', xlsx: 'table_chart',
    };
    return map[ext] ?? 'insert_drive_file';
  }

  fileIconClass(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return 'icon-image';
    if (ext === 'pdf') return 'icon-pdf';
    if (['json','yaml','yml','toml','xml','html','htm','css','js','ts'].includes(ext)) return 'icon-code';
    if (['zip','gz','tar','bz2'].includes(ext)) return 'icon-archive';
    if (['mp4','mov','mp3','wav'].includes(ext)) return 'icon-media';
    if (['csv','xlsx'].includes(ext)) return 'icon-data';
    return 'icon-file';
  }
}
