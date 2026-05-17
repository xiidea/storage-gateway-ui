import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import {
  Tenant, AccessKey, Store, BucketMapping,
  BackendType, PresignedMode, CreateStoreRequest,
} from '../../core/models';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, UpperCasePipe, ConfirmDialogComponent],
  styles: [`
    .page { padding: 32px; }

    /* ── Header ─────────────────────────────────────────────── */
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--color-text-muted);
      text-decoration: none;
      margin-bottom: 16px;
      transition: color .15s;
      &:hover { color: var(--color-text); }
      .material-symbols-rounded { font-size: 16px; }
    }

    .tenant-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .tenant-id-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 6px;
    }

    .id-badge {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--color-text-muted);
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--r-sm);
      padding: 2px 8px;
    }

    /* ── Section headers ─────────────────────────────────────── */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      h2 {
        font-size: 16px;
        font-weight: 700;
      }
    }

    /* ── Access Keys ─────────────────────────────────────────── */
    .secret-once {
      background: var(--color-warning-bg);
      border: 1px solid var(--color-warning);
      border-radius: var(--r-md);
      padding: 14px 16px;
      margin-bottom: 16px;
      font-size: 12px;
      color: var(--color-warning);

      .secret-val {
        font-family: var(--font-mono);
        font-size: 12px;
        word-break: break-all;
        color: var(--color-text);
        margin-top: 8px;
        padding: 8px 10px;
        background: var(--color-surface);
        border-radius: var(--r-sm);
        border: 1px solid var(--color-border);
        line-height: 1.8;
      }
    }

    /* ── Store cards ─────────────────────────────────────────── */
    .store-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .store-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--r-lg);
      overflow: hidden;
      box-shadow: var(--shadow-card);
      transition: box-shadow .15s;
      &:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }

      .store-card-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--color-border);
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .store-icon {
        width: 40px; height: 40px;
        border-radius: var(--r-md);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
      }

      .store-card-body { padding: 14px 20px; }

      .store-actions {
        padding: 10px 20px;
        border-top: 1px solid var(--color-border);
        display: flex;
        gap: 8px;
        background: var(--color-bg);
      }
    }

    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      padding: 3px 0;
      color: var(--color-text-muted);
      span:last-child { color: var(--color-text); font-weight: 500; }
    }

    /* ── Bucket list ─────────────────────────────────────────── */
    .bucket-list { list-style: none; }
    .bucket-item {
      display: flex; align-items: center;
      padding: 9px 0; border-bottom: 1px solid var(--color-border);
      &:last-child { border-bottom: none; }
      .arrow { color: var(--color-text-muted); margin: 0 10px; }
    }

    /* ── Shared ──────────────────────────────────────────────── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 48px 24px; color: var(--color-text-muted); gap: 10px;
      .material-symbols-rounded { font-size: 44px; opacity: .25; }
      p { font-size: 13px; }
    }

    .modal-wide { max-width: 620px !important; }

    .backend-tabs {
      display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 16px;
      button {
        padding: 6px 14px;
        border-radius: var(--r-full);
        font-size: 12px; font-weight: 600;
        border: 1.5px solid var(--color-border);
        background: var(--color-surface);
        color: var(--color-text-muted);
        cursor: pointer; transition: all .15s;
        &.active { background: var(--color-secondary); border-color: var(--color-secondary); color: #fff; }
      }
    }

    .divider {
      border: none;
      border-top: 1px solid var(--color-border);
      margin: 32px 0;
    }
  `],
  template: `
    <div class="page">

      <!-- Back -->
      <a class="back-link" routerLink="/tenants">
        <span class="material-symbols-rounded">arrow_back</span>
        Tenants
      </a>

      <!-- Tenant header -->
      @if (tenant()) {
        <div class="tenant-header">
          <div>
            <h1 class="headline-md">{{ tenant()!.name }}</h1>
            <div class="tenant-id-row">
              <span class="id-badge">{{ tenant()!.id }}</span>
              <span style="font-size:11px;color:var(--color-text-muted)">
                Created {{ tenant()!.created_at | date:'d MMM yyyy' }}
              </span>
            </div>
          </div>
        </div>
      } @else if (loadingTenant()) {
        <div style="height:60px;display:flex;align-items:center;gap:10px;color:var(--color-text-muted);margin-bottom:32px">
          <div class="spinner"></div> Loading tenant…
        </div>
      }

      <!-- ═══════════════ ACCESS KEYS ═══════════════ -->
      <div class="section-header">
        <h2>Access Keys</h2>
        <button class="btn btn-primary btn-sm"
                [disabled]="creatingKey()"
                (click)="createKey()">
          <span class="material-symbols-rounded" style="font-size:16px">add</span>
          Generate Key
        </button>
      </div>

      @if (newKey()) {
        <div class="secret-once">
          <strong>⚠ Save the secret key now — it will not be shown again</strong>
          <div class="secret-val">
            <div><b>Access Key:</b> {{ newKey()!.access_key }}</div>
            <div><b>Secret Key:</b> {{ newKey()!.secret_key }}</div>
          </div>
          <div style="display:flex;gap:6px;margin-top:10px">
            <button class="btn btn-ghost btn-sm" (click)="copySecret()">
              <span class="material-symbols-rounded" style="font-size:14px">content_copy</span>
              Copy credentials
            </button>
            <button class="btn btn-ghost btn-sm" (click)="newKey.set(null)">
              <span class="material-symbols-rounded" style="font-size:14px">close</span>
              Dismiss
            </button>
          </div>
        </div>
      }

      <div class="card" style="margin-bottom:0">
        @if (loadingKeys()) {
          <div style="padding:32px;text-align:center"><div class="spinner" style="margin:0 auto"></div></div>
        } @else if (keys().length === 0) {
          <div class="empty-state">
            <span class="material-symbols-rounded">key_off</span>
            <p>No access keys yet. Generate one to enable S3 access.</p>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Access Key ID</th>
                <th>Created</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (k of keys(); track k.id) {
                <tr>
                  <td><span class="mono">{{ k.access_key }}</span></td>
                  <td>{{ k.created_at | date:'d MMM yyyy, HH:mm' }}</td>
                  <td>
                    @if (k.revoked_at) {
                      <span class="chip chip-error">Revoked</span>
                    } @else {
                      <span class="chip chip-success">Active</span>
                    }
                  </td>
                  <td>
                    @if (!k.revoked_at) {
                      <button class="btn btn-ghost btn-sm"
                              style="color:var(--color-error)"
                              (click)="confirmRevoke(k)">
                        <span class="material-symbols-rounded" style="font-size:14px">block</span>
                        Revoke
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <hr class="divider">

      <!-- ═══════════════ STORES ═══════════════ -->
      <div class="section-header">
        <h2>Storage Backends</h2>
        <button class="btn btn-primary btn-sm" (click)="openCreateStore()">
          <span class="material-symbols-rounded" style="font-size:16px">add</span>
          Add Store
        </button>
      </div>

      @if (loadingStores()) {
        <div style="padding:48px;text-align:center;color:var(--color-text-muted)">
          <div class="spinner" style="margin:0 auto 12px"></div>Loading stores…
        </div>
      } @else if (stores().length === 0) {
        <div class="card">
          <div class="empty-state">
            <span class="material-symbols-rounded">cloud_off</span>
            <p>No storage backends configured.</p>
          </div>
        </div>
      } @else {
        <div class="store-grid">
          @for (store of stores(); track store.id) {
            <div class="store-card">
              <div class="store-card-header">
                <div class="store-icon"
                     [style.background]="backendColor(store.backend_type) + '22'"
                     [style.color]="backendColor(store.backend_type)">
                  {{ backendIcon(store.backend_type) }}
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    {{ store.name }}
                  </div>
                  <div style="display:flex;gap:6px;margin-top:3px">
                    <span class="chip chip-info">{{ store.backend_type | uppercase }}</span>
                    <span class="chip chip-neutral">{{ store.presigned_mode }}</span>
                  </div>
                </div>
              </div>
              <div class="store-card-body">
                <div class="meta-row">
                  <span>Store ID</span>
                  <span class="mono" style="font-size:11px">{{ store.id.slice(0,12) }}…</span>
                </div>
                <div class="meta-row">
                  <span>Created</span>
                  <span>{{ store.created_at | date:'d MMM yyyy' }}</span>
                </div>
                <div class="meta-row">
                  <span>Buckets</span>
                  <span>{{ bucketCount(store.id) }} mappings</span>
                </div>
              </div>
              <div class="store-actions">
                <button class="btn btn-secondary btn-sm" (click)="openBuckets(store)">
                  <span class="material-symbols-rounded" style="font-size:14px">link</span>
                  Buckets
                </button>
                <button class="btn btn-ghost btn-sm" (click)="openUpdateBackend(store)">
                  <span class="material-symbols-rounded" style="font-size:14px">edit</span>
                  Credentials
                </button>
                <button class="btn btn-ghost btn-sm"
                        style="margin-left:auto;color:var(--color-error)"
                        (click)="confirmDeleteStore(store)">
                  <span class="material-symbols-rounded" style="font-size:14px">delete</span>
                </button>
              </div>
            </div>
          }
        </div>
      }

    </div>

    <!-- ══ Create Store modal ══ -->
    @if (showCreateStore()) {
      <div class="modal-backdrop" (click)="showCreateStore.set(false)">
        <div class="modal modal-wide" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Add Storage Backend</h2>
            <button class="btn btn-ghost" (click)="showCreateStore.set(false)">
              <span class="material-symbols-rounded">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Store Name</label>
              <input [(ngModel)]="storeForm.name" placeholder="e.g. primary, backup-s3" />
            </div>
            <div>
              <label class="label-caps" style="display:block;margin-bottom:8px;color:var(--color-text-muted)">Backend Type</label>
              <div class="backend-tabs">
                @for (bt of backendTypes; track bt.value) {
                  <button [class.active]="storeForm.backend_type === bt.value"
                          (click)="storeForm.backend_type = bt.value">
                    {{ bt.icon }} {{ bt.label }}
                  </button>
                }
              </div>
            </div>
            <div class="form-group">
              <label>Presigned URL Mode</label>
              <select [(ngModel)]="storeForm.presigned_mode">
                <option value="proxy">proxy (stream through gateway)</option>
                <option value="redirect">redirect (307 to upstream)</option>
              </select>
            </div>

            @if (storeForm.backend_type === 's3' || storeForm.backend_type === 'r2') {
              <div class="form-group">
                <label>Region</label>
                <input [(ngModel)]="s3Cfg.region" [placeholder]="storeForm.backend_type === 'r2' ? 'auto' : 'us-east-1'" />
              </div>
              @if (storeForm.backend_type === 'r2') {
                <div class="form-group">
                  <label>Endpoint URL</label>
                  <input [(ngModel)]="s3Cfg.endpoint" placeholder="https://<account-id>.r2.cloudflarestorage.com" />
                </div>
              }
              <div class="form-group">
                <label>Access Key ID</label>
                <input [(ngModel)]="s3Cfg.access_key_id" placeholder="AKIA…" />
              </div>
              <div class="form-group">
                <label>Secret Access Key</label>
                <input type="password" [(ngModel)]="s3Cfg.secret_access_key" placeholder="••••••••" />
              </div>
            }
            @if (storeForm.backend_type === 'gcs') {
              <div class="form-group">
                <label>Service Account JSON</label>
                <textarea [(ngModel)]="gcsCfgRaw" placeholder='{ "type": "service_account", ... }' style="min-height:120px;font-family:var(--font-mono);font-size:12px"></textarea>
                <span class="hint">Paste the raw content of your GCP service account key file</span>
              </div>
            }
            @if (storeForm.backend_type === 'azure') {
              <div class="form-group">
                <label>Storage Account Name</label>
                <input [(ngModel)]="azureCfg.account_name" placeholder="mystorageaccount" />
              </div>
              <div class="form-group">
                <label>Account Key (base64)</label>
                <input type="password" [(ngModel)]="azureCfg.account_key" placeholder="••••••••==" />
              </div>
              <div class="form-group">
                <label>Service URL (optional)</label>
                <input [(ngModel)]="azureCfg.service_url" placeholder="https://mystorageaccount.blob.core.windows.net" />
              </div>
            }
            @if (storeForm.backend_type === 'local') {
              <div class="form-group">
                <label>Root Path</label>
                <input [(ngModel)]="localCfg.root_path" placeholder="/var/data/storage-gateway" />
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showCreateStore.set(false)">Cancel</button>
            <button class="btn btn-primary" [disabled]="savingStore()" (click)="createStore()">
              @if (savingStore()) { <div class="spinner"></div> }
              Create Store
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══ Bucket mappings modal ══ -->
    @if (activeBucketStore()) {
      <div class="modal-backdrop" (click)="activeBucketStore.set(null)">
        <div class="modal modal-wide" (click)="$event.stopPropagation()" style="max-width:680px">
          <div class="modal-header">
            <h2>Bucket Mappings — {{ activeBucketStore()!.name }}</h2>
            <button class="btn btn-ghost" (click)="activeBucketStore.set(null)">
              <span class="material-symbols-rounded">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:16px">
              <div class="form-group" style="flex:1;margin:0">
                <label>Gateway Bucket</label>
                <input [(ngModel)]="newGatewayBucket" placeholder="acme-uploads" />
              </div>
              <div style="color:var(--color-text-muted);padding-bottom:10px">→</div>
              <div class="form-group" style="flex:1;margin:0">
                <label>Backend Bucket</label>
                <input [(ngModel)]="newBackendBucket" placeholder="prod-uploads-eu" />
              </div>
              <button class="btn btn-primary btn-sm" style="padding:10px 14px"
                      [disabled]="!newGatewayBucket.trim() || !newBackendBucket.trim() || addingBucket()"
                      (click)="addBucketMapping()">
                <span class="material-symbols-rounded" style="font-size:16px">add</span>
              </button>
            </div>

            @if (loadingBuckets()) {
              <div style="text-align:center;padding:24px"><div class="spinner" style="margin:0 auto"></div></div>
            } @else if (activeBuckets().length === 0) {
              <div class="empty-state" style="padding:24px 0">
                <span class="material-symbols-rounded">link_off</span>
                <p>No bucket mappings yet</p>
              </div>
            } @else {
              <ul class="bucket-list">
                @for (b of activeBuckets(); track b.id) {
                  <li class="bucket-item">
                    <span class="mono" style="font-size:13px">{{ b.gateway_bucket }}</span>
                    <span class="arrow">→</span>
                    <span class="mono" style="font-size:13px;color:var(--color-text-muted)">{{ b.backend_bucket }}</span>
                    <div style="display:flex;gap:4px;margin-left:auto">
                      <button class="btn btn-ghost btn-sm"
                              title="Browse files"
                              (click)="openBrowser(activeBucketStore()!.id, b)">
                        <span class="material-symbols-rounded" style="font-size:14px">folder_open</span>
                      </button>
                      <button class="btn btn-ghost btn-sm"
                              style="color:var(--color-error)"
                              (click)="confirmDeleteBucket(b)">
                        <span class="material-symbols-rounded" style="font-size:14px">delete</span>
                      </button>
                    </div>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      </div>
    }

    <!-- ══ Update credentials modal ══ -->
    @if (updateStore()) {
      <div class="modal-backdrop" (click)="updateStore.set(null)">
        <div class="modal modal-wide" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Update Credentials — {{ updateStore()!.name }}</h2>
            <button class="btn btn-ghost" (click)="updateStore.set(null)">
              <span class="material-symbols-rounded">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div style="padding:10px 14px;background:var(--color-warning-bg);border:1px solid var(--color-warning);border-radius:var(--r-md);font-size:12px;color:var(--color-warning);margin-bottom:4px">
              This replaces the stored backend credentials and evicts the cache.
            </div>
            <div class="form-group">
              <label>New Credentials JSON</label>
              <textarea [(ngModel)]="updateConfigRaw" placeholder='{ "region": "us-east-1", ... }' style="min-height:120px;font-family:var(--font-mono);font-size:12px"></textarea>
            </div>
            <div class="form-group">
              <label>Presigned Mode</label>
              <select [(ngModel)]="updatePresignedMode">
                <option value="proxy">proxy</option>
                <option value="redirect">redirect</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="updateStore.set(null)">Cancel</button>
            <button class="btn btn-primary" [disabled]="savingUpdate()" (click)="saveUpdateBackend()">
              @if (savingUpdate()) { <div class="spinner"></div> }
              Save Changes
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══ Confirm dialogs ══ -->
    @if (revokeTarget()) {
      <app-confirm-dialog
        title="Revoke Access Key"
        [message]="'Revoke key ' + revokeTarget()!.access_key + '? This cannot be undone.'"
        confirmLabel="Revoke"
        (confirmed)="revokeKey()"
        (cancelled)="revokeTarget.set(null)" />
    }
    @if (deleteStoreTarget()) {
      <app-confirm-dialog
        title="Delete Store"
        [message]="'Delete store ' + deleteStoreTarget()!.name + '? All bucket mappings will be removed.'"
        confirmLabel="Delete"
        (confirmed)="deleteStore()"
        (cancelled)="deleteStoreTarget.set(null)" />
    }
    @if (deleteBucketTarget()) {
      <app-confirm-dialog
        title="Remove Bucket Mapping"
        [message]="'Remove mapping ' + deleteBucketTarget()!.gateway_bucket + ' → ' + deleteBucketTarget()!.backend_bucket + '?'"
        confirmLabel="Remove"
        (confirmed)="deleteBucketMapping()"
        (cancelled)="deleteBucketTarget.set(null)" />
    }
  `,
})
export class TenantDetailComponent implements OnInit {
  private api    = inject(ApiService);
  private toast  = inject(ToastService);
  private router = inject(Router);

  id = input.required<string>();

  tenant       = signal<Tenant | null>(null);
  loadingTenant = signal(true);

  // Keys
  keys         = signal<AccessKey[]>([]);
  loadingKeys  = signal(true);
  creatingKey  = signal(false);
  newKey       = signal<AccessKey | null>(null);
  revokeTarget = signal<AccessKey | null>(null);

  // Stores
  stores        = signal<Store[]>([]);
  loadingStores = signal(true);
  bucketsByStore = signal<Record<string, BucketMapping[]>>({});
  showCreateStore = signal(false);
  savingStore    = signal(false);
  deleteStoreTarget = signal<Store | null>(null);

  // Bucket mappings
  activeBucketStore  = signal<Store | null>(null);
  activeBuckets      = signal<BucketMapping[]>([]);
  loadingBuckets     = signal(false);
  addingBucket       = signal(false);
  newGatewayBucket   = '';
  newBackendBucket   = '';
  deleteBucketTarget = signal<BucketMapping | null>(null);

  // Update credentials
  updateStore       = signal<Store | null>(null);
  updateConfigRaw   = '{}';
  updatePresignedMode: PresignedMode = 'proxy';
  savingUpdate      = signal(false);

  // Store form state
  storeForm = { name: '', backend_type: 's3' as BackendType, presigned_mode: 'proxy' as PresignedMode };
  s3Cfg     = { region: '', endpoint: '', access_key_id: '', secret_access_key: '', force_path_style: false };
  gcsCfgRaw = '';
  azureCfg  = { account_name: '', account_key: '', service_url: '' };
  localCfg  = { root_path: '' };

  readonly backendTypes = [
    { value: 's3'    as BackendType, label: 'AWS S3',   icon: '☁'  },
    { value: 'gcs'   as BackendType, label: 'GCS',      icon: '🔵' },
    { value: 'r2'    as BackendType, label: 'R2',       icon: '🟠' },
    { value: 'azure' as BackendType, label: 'Azure',    icon: '🔷' },
    { value: 'local' as BackendType, label: 'Local FS', icon: '💾' },
  ];

  ngOnInit() {
    const tenantId = this.id();
    this.api.getTenant(tenantId).subscribe({
      next: (t) => { this.tenant.set(t); this.loadingTenant.set(false); },
      error: () => { this.loadingTenant.set(false); this.toast.error('Tenant not found'); },
    });
    this.loadKeys();
    this.loadStores();
  }

  // ── Keys ────────────────────────────────────────────────────

  private loadKeys() {
    this.loadingKeys.set(true);
    this.api.listKeys(this.id()).subscribe({
      next: (keys) => { this.keys.set(keys); this.loadingKeys.set(false); },
      error: () => { this.loadingKeys.set(false); this.toast.error('Failed to load access keys'); },
    });
  }

  createKey() {
    this.creatingKey.set(true);
    this.api.createKey(this.id()).subscribe({
      next: (k) => {
        this.creatingKey.set(false);
        this.newKey.set(k);
        this.loadKeys();
        this.toast.success('Access key generated');
      },
      error: (err) => {
        this.creatingKey.set(false);
        this.toast.error(`Failed to create key: ${err.message}`);
      },
    });
  }

  confirmRevoke(k: AccessKey) { this.revokeTarget.set(k); }

  revokeKey() {
    const k = this.revokeTarget();
    if (!k) return;
    this.api.revokeKey(this.id(), k.id).subscribe({
      next: () => {
        this.revokeTarget.set(null);
        this.toast.success('Access key revoked');
        this.loadKeys();
      },
      error: () => this.toast.error('Failed to revoke key'),
    });
  }

  copySecret() {
    const k = this.newKey();
    if (!k) return;
    navigator.clipboard.writeText(`Access Key: ${k.access_key}\nSecret Key: ${k.secret_key}`)
      .then(() => this.toast.info('Credentials copied to clipboard'));
  }

  // ── Stores ──────────────────────────────────────────────────

  private loadStores() {
    this.loadingStores.set(true);
    this.api.listStores(this.id()).subscribe({
      next: (stores) => {
        this.stores.set(stores);
        this.loadingStores.set(false);
        stores.forEach(s => this.loadBucketCount(s.id));
      },
      error: () => {
        this.loadingStores.set(false);
        this.toast.error('Failed to load stores');
      },
    });
  }

  private loadBucketCount(storeId: string) {
    this.api.listBuckets(this.id(), storeId).subscribe({
      next: (buckets) => this.bucketsByStore.update(m => ({ ...m, [storeId]: buckets })),
    });
  }

  bucketCount(storeId: string) { return this.bucketsByStore()[storeId]?.length ?? 0; }

  openCreateStore() {
    this.storeForm  = { name: '', backend_type: 's3', presigned_mode: 'proxy' };
    this.s3Cfg      = { region: '', endpoint: '', access_key_id: '', secret_access_key: '', force_path_style: false };
    this.gcsCfgRaw  = '';
    this.azureCfg   = { account_name: '', account_key: '', service_url: '' };
    this.localCfg   = { root_path: '' };
    this.showCreateStore.set(true);
  }

  createStore() {
    if (!this.storeForm.name.trim()) { this.toast.error('Store name is required'); return; }
    this.savingStore.set(true);

    let backendConfig: Record<string, unknown>;
    switch (this.storeForm.backend_type) {
      case 's3':
        backendConfig = { region: this.s3Cfg.region, access_key_id: this.s3Cfg.access_key_id, secret_access_key: this.s3Cfg.secret_access_key };
        break;
      case 'r2':
        backendConfig = { region: this.s3Cfg.region || 'auto', endpoint: this.s3Cfg.endpoint, access_key_id: this.s3Cfg.access_key_id, secret_access_key: this.s3Cfg.secret_access_key, force_path_style: true };
        break;
      case 'gcs':
        try { backendConfig = { credentials_json: JSON.parse(this.gcsCfgRaw) }; }
        catch { this.toast.error('Invalid JSON for GCS credentials'); this.savingStore.set(false); return; }
        break;
      case 'azure':
        backendConfig = { account_name: this.azureCfg.account_name, account_key: this.azureCfg.account_key, ...(this.azureCfg.service_url ? { service_url: this.azureCfg.service_url } : {}) };
        break;
      case 'local':
        backendConfig = { root_path: this.localCfg.root_path };
        break;
      default:
        backendConfig = {};
    }

    const req: CreateStoreRequest = {
      name: this.storeForm.name.trim(),
      backend_type: this.storeForm.backend_type,
      presigned_mode: this.storeForm.presigned_mode,
      backend_config: backendConfig,
    };

    this.api.createStore(this.id(), req).subscribe({
      next: () => {
        this.savingStore.set(false);
        this.showCreateStore.set(false);
        this.toast.success('Store created');
        this.loadStores();
      },
      error: (err) => {
        this.savingStore.set(false);
        this.toast.error(`Failed to create store: ${err.message}`);
      },
    });
  }

  confirmDeleteStore(s: Store) { this.deleteStoreTarget.set(s); }

  deleteStore() {
    const s = this.deleteStoreTarget();
    if (!s) return;
    this.api.deleteStore(this.id(), s.id).subscribe({
      next: () => {
        this.deleteStoreTarget.set(null);
        this.toast.success('Store deleted');
        this.loadStores();
      },
      error: () => this.toast.error('Failed to delete store'),
    });
  }

  // ── Bucket mappings ─────────────────────────────────────────

  openBuckets(store: Store) {
    this.activeBucketStore.set(store);
    this.newGatewayBucket = '';
    this.newBackendBucket = '';
    this.loadingBuckets.set(true);
    this.api.listBuckets(this.id(), store.id).subscribe({
      next: (b) => { this.activeBuckets.set(b); this.loadingBuckets.set(false); },
      error: () => this.loadingBuckets.set(false),
    });
  }

  addBucketMapping() {
    const store = this.activeBucketStore();
    if (!store) return;
    this.addingBucket.set(true);
    this.api.createBucket(this.id(), store.id, this.newGatewayBucket.trim(), this.newBackendBucket.trim()).subscribe({
      next: () => {
        this.addingBucket.set(false);
        this.newGatewayBucket = '';
        this.newBackendBucket = '';
        this.toast.success('Bucket mapping added');
        this.openBuckets(store);
      },
      error: (err) => {
        this.addingBucket.set(false);
        this.toast.error(`Failed: ${err.message}`);
      },
    });
  }

  openBrowser(storeId: string, bucket: BucketMapping) {
    this.router.navigate(['/browser', this.id(), storeId, bucket.id], {
      queryParams: { bucket: bucket.gateway_bucket },
    });
  }

  confirmDeleteBucket(b: BucketMapping) { this.deleteBucketTarget.set(b); }

  deleteBucketMapping() {
    const store = this.activeBucketStore();
    const b = this.deleteBucketTarget();
    if (!store || !b) return;
    this.api.deleteBucket(this.id(), store.id, b.id).subscribe({
      next: () => {
        this.deleteBucketTarget.set(null);
        this.toast.success('Mapping removed');
        this.openBuckets(store);
      },
      error: () => this.toast.error('Failed to remove mapping'),
    });
  }

  // ── Update credentials ──────────────────────────────────────

  openUpdateBackend(store: Store) {
    this.updateStore.set(store);
    this.updateConfigRaw = '{}';
    this.updatePresignedMode = store.presigned_mode;
  }

  saveUpdateBackend() {
    const store = this.updateStore();
    if (!store) return;
    let cfg: Record<string, unknown>;
    try { cfg = JSON.parse(this.updateConfigRaw); }
    catch { this.toast.error('Invalid JSON'); return; }
    this.savingUpdate.set(true);
    this.api.updateBackend(this.id(), store.id, { backend_config: cfg, presigned_mode: this.updatePresignedMode }).subscribe({
      next: () => {
        this.savingUpdate.set(false);
        this.updateStore.set(null);
        this.toast.success('Credentials updated');
        this.loadStores();
      },
      error: (err) => {
        this.savingUpdate.set(false);
        this.toast.error(`Failed: ${err.message}`);
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────

  backendColor(type: string): string {
    return ({ s3: '#ff9900', gcs: '#4285f4', r2: '#f6821f', azure: '#0078d4', local: '#1a7f4b' } as Record<string, string>)[type] ?? '#666';
  }

  backendIcon(type: string): string {
    return ({ s3: '☁', gcs: '🔵', r2: '🟠', azure: '🔷', local: '💾' } as Record<string, string>)[type] ?? '📦';
  }
}
