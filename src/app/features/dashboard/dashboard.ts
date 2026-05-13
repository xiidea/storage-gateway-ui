import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { ConfigService } from '../../core/services/config.service';
import { Tenant } from '../../core/models';

interface TenantRow extends Tenant {
  storeCount: number;
  keyCount: number;
  detailLoading: boolean;
}

type DepStatus = 'ok' | 'degraded' | 'unknown';
type ApiState  = 'checking' | 'online' | 'degraded' | 'offline';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink],
  styles: [`
    .page { padding: 32px; }

    /* ── Header ─────────────────────────────────────────────── */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 28px;
    }

    .api-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--color-text-muted);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--r-full);
      padding: 6px 14px;
      box-shadow: var(--shadow-card);

      .api-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
        &-online   { background: #4ade80; box-shadow: 0 0 0 2px rgba(74,222,128,.2); }
        &-degraded { background: #facc15; }
        &-offline  { background: #f87171; }
        &-checking { background: var(--color-border); animation: blink 1.2s infinite; }
      }

      .api-url  { font-family: var(--font-mono); font-size: 11px; }
      .api-ms   { font-family: var(--font-mono); font-size: 11px; opacity: .6; }
    }

    /* ── Metric cards ────────────────────────────────────────── */
    .metric-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }

    .metric-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--r-lg);
      padding: 20px 22px;
      box-shadow: var(--shadow-card);
    }

    .metric-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: var(--color-text-muted);
      margin-bottom: 10px;
    }

    .metric-value {
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }

    .metric-sub {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .skeleton-value {
      height: 32px;
      width: 48px;
      background: var(--color-border);
      border-radius: var(--r-sm);
      animation: shimmer 1.4s infinite;
      margin-bottom: 8px;
    }

    /* health card rows */
    .dep-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      padding: 3px 0;

      .dep-dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
        &-ok      { background: #4ade80; }
        &-degraded{ background: #facc15; }
        &-unknown { background: var(--color-border); }
      }

      .dep-name  { flex: 1; color: var(--color-text-muted); }
      .dep-state {
        font-weight: 700;
        font-size: 11px;
        text-transform: uppercase;
        &-ok      { color: var(--color-success); }
        &-degraded{ color: var(--color-warning); }
        &-unknown { color: var(--color-text-muted); }
      }
    }

    /* ── Tenant table ────────────────────────────────────────── */
    .table-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--r-lg);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }

    .table-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid var(--color-border);
    }

    table {
      width: 100%;
      border-collapse: collapse;

      th {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .06em;
        color: var(--color-text-muted);
        padding: 10px 20px;
        text-align: left;
        background: var(--color-bg);
        border-bottom: 1px solid var(--color-border);
      }

      td {
        padding: 13px 20px;
        font-size: 13px;
        border-bottom: 1px solid var(--color-border);
        vertical-align: middle;
      }

      tr:last-child td { border-bottom: none; }
      tr:hover td { background: var(--color-bg); }
    }

    .tenant-name { font-weight: 600; }
    .tenant-id   { font-family: var(--font-mono); font-size: 10px; color: var(--color-text-muted); margin-top: 2px; }

    .count-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--r-full);
      padding: 2px 10px;
      .material-symbols-rounded { font-size: 13px; color: var(--color-text-muted); }
    }

    .skeleton-chip {
      display: inline-block;
      width: 48px; height: 22px;
      background: var(--color-border);
      border-radius: var(--r-full);
      animation: shimmer 1.4s infinite;
    }

    .manage-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-secondary);
      background: var(--color-secondary-light);
      border: none;
      border-radius: var(--r-md);
      padding: 5px 12px;
      cursor: pointer;
      text-decoration: none;
      transition: opacity .15s;
      &:hover { opacity: .8; }
      .material-symbols-rounded { font-size: 14px; }
    }

    /* ── Empty + loading states ──────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--color-text-muted);

      .material-symbols-rounded { font-size: 48px; opacity: .25; margin-bottom: 12px; }
      p { font-size: 13px; margin-bottom: 16px; }
    }

    .skeleton-row td { padding: 14px 20px; }

    @keyframes blink   { 0%,100% { opacity: 1 } 50% { opacity: .3 } }
    @keyframes shimmer { 0%,100% { opacity: 1 } 50% { opacity: .45 } }
  `],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="headline-md">Dashboard</h1>
          <p style="color:var(--color-text-muted);font-size:13px;margin-top:2px">
            Live summary of your storage gateway
          </p>
        </div>

        <div class="api-pill">
          <span class="api-dot api-dot-{{ apiState() }}"></span>
          <span class="api-url">{{ config.apiUrl() }}</span>
          @if (latency() !== null) {
            <span class="api-ms">{{ latency() }}ms</span>
          }
        </div>
      </div>

      <!-- Metric row -->
      <div class="metric-row">

        <!-- Tenants -->
        <div class="metric-card">
          <div class="metric-label">Tenants</div>
          @if (loading()) {
            <div class="skeleton-value"></div>
          } @else {
            <div class="metric-value" style="color:var(--color-secondary)">{{ tenants().length }}</div>
          }
          <div class="metric-sub">registered</div>
        </div>

        <!-- Stores -->
        <div class="metric-card">
          <div class="metric-label">Stores</div>
          @if (loading()) {
            <div class="skeleton-value"></div>
          } @else {
            <div class="metric-value" style="color:var(--color-primary)">{{ totalStores() }}</div>
          }
          <div class="metric-sub">across all tenants</div>
        </div>

        <!-- Keys -->
        <div class="metric-card">
          <div class="metric-label">Access Keys</div>
          @if (loading()) {
            <div class="skeleton-value"></div>
          } @else {
            <div class="metric-value" style="color:#7c3aed">{{ totalKeys() }}</div>
          }
          <div class="metric-sub">active credentials</div>
        </div>

        <!-- Health -->
        <div class="metric-card">
          <div class="metric-label">Dependencies</div>
          <div style="margin-top:6px;display:flex;flex-direction:column;gap:2px">
            <div class="dep-row">
              <span class="dep-dot dep-dot-{{ dbStatus() }}"></span>
              <span class="dep-name">Database</span>
              <span class="dep-state dep-state-{{ dbStatus() }}">{{ dbStatus() }}</span>
            </div>
            <div class="dep-row">
              <span class="dep-dot dep-dot-{{ redisStatus() }}"></span>
              <span class="dep-name">Cache</span>
              <span class="dep-state dep-state-{{ redisStatus() }}">{{ redisStatus() }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Tenant table -->
      <div class="table-card">
        <div class="table-toolbar">
          <span style="font-size:14px;font-weight:600">Tenants</span>
          <a class="manage-btn" routerLink="/tenants">
            <span class="material-symbols-rounded">add</span>
            New Tenant
          </a>
        </div>

        @if (loading()) {
          <table>
            <thead>
              <tr>
                <th>Tenant</th><th>Stores</th><th>Access Keys</th><th>Created</th><th></th>
              </tr>
            </thead>
            <tbody>
              @for (_ of skeletonRows; track $index) {
                <tr class="skeleton-row">
                  <td><div style="height:14px;width:120px;background:var(--color-border);border-radius:var(--r-sm);animation:shimmer 1.4s infinite"></div></td>
                  <td><span class="skeleton-chip"></span></td>
                  <td><span class="skeleton-chip"></span></td>
                  <td><div style="height:12px;width:80px;background:var(--color-border);border-radius:var(--r-sm);animation:shimmer 1.4s infinite"></div></td>
                  <td></td>
                </tr>
              }
            </tbody>
          </table>
        } @else if (tenants().length === 0) {
          <div class="empty-state">
            <span class="material-symbols-rounded">group_off</span>
            <p>No tenants yet. Create your first tenant to get started.</p>
            <a class="manage-btn" routerLink="/tenants">
              <span class="material-symbols-rounded">arrow_forward</span>
              Go to Tenants
            </a>
          </div>
        } @else {
          <table>
            <thead>
              <tr>
                <th>Tenant</th><th>Stores</th><th>Access Keys</th><th>Created</th><th></th>
              </tr>
            </thead>
            <tbody>
              @for (t of tenants(); track t.id) {
                <tr>
                  <td>
                    <div class="tenant-name">{{ t.name }}</div>
                    <div class="tenant-id">{{ t.id }}</div>
                  </td>
                  <td>
                    @if (t.detailLoading) {
                      <span class="skeleton-chip"></span>
                    } @else {
                      <span class="count-chip">
                        <span class="material-symbols-rounded">cloud_circle</span>
                        {{ t.storeCount }}
                      </span>
                    }
                  </td>
                  <td>
                    @if (t.detailLoading) {
                      <span class="skeleton-chip"></span>
                    } @else {
                      <span class="count-chip">
                        <span class="material-symbols-rounded">key</span>
                        {{ t.keyCount }}
                      </span>
                    }
                  </td>
                  <td style="color:var(--color-text-muted)">{{ t.created_at | date:'d MMM yyyy' }}</td>
                  <td>
                    <a class="manage-btn" [routerLink]="['/tenants', t.id]">
                      <span class="material-symbols-rounded">arrow_forward</span>
                      Manage
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

    </div>
  `,
})
export class DashboardComponent implements OnInit {
  config = inject(ConfigService);
  private api = inject(ApiService);

  loading    = signal(true);
  apiState   = signal<ApiState>('checking');
  latency    = signal<number | null>(null);
  dbStatus   = signal<DepStatus>('unknown');
  redisStatus = signal<DepStatus>('unknown');
  tenants    = signal<TenantRow[]>([]);

  totalStores = computed(() => this.tenants().reduce((s, t) => s + t.storeCount, 0));
  totalKeys   = computed(() => this.tenants().reduce((s, t) => s + t.keyCount,   0));

  readonly skeletonRows = [1, 2, 3];

  ngOnInit() {
    this.load();
  }

  private load() {
    const start = Date.now();

    forkJoin({
      health:  this.api.healthAdmin().pipe(catchError(() => of(null))),
      tenants: this.api.listTenants().pipe(catchError(() => of([] as Tenant[]))),
    }).subscribe(({ health, tenants }) => {
      // Health
      if (health) {
        const body = (health as any).body ?? {};
        this.apiState.set(body.status === 'degraded' ? 'degraded' : 'online');
        this.latency.set(Date.now() - start);
        this.dbStatus.set(body.checks?.database?.status === 'ok' ? 'ok' : 'degraded');
        this.redisStatus.set(body.checks?.redis?.status    === 'ok' ? 'ok' : 'degraded');
      } else {
        this.apiState.set('offline');
      }

      // Tenant rows — show immediately, load detail counts async
      const rows: TenantRow[] = (tenants as Tenant[]).map(t => ({
        ...t, storeCount: 0, keyCount: 0, detailLoading: true,
      }));
      this.tenants.set(rows);
      this.loading.set(false);

      rows.forEach(t => this.loadTenantDetail(t.id));
    });
  }

  private loadTenantDetail(tenantId: string) {
    forkJoin({
      stores: this.api.listStores(tenantId).pipe(catchError(() => of([]))),
      keys:   this.api.listKeys(tenantId).pipe(catchError(() => of([]))),
    }).subscribe(({ stores, keys }) => {
      const activeKeys = (keys as any[]).filter(k => !k.revoked_at).length;
      this.tenants.update(rows => rows.map(r =>
        r.id === tenantId
          ? { ...r, storeCount: (stores as any[]).length, keyCount: activeKeys, detailLoading: false }
          : r
      ));
    });
  }
}
