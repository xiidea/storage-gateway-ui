import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Tenant } from '../../core/models';

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  styles: [`
    .page { padding: 32px; }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 28px;
    }

    .create-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      margin-bottom: 24px;
      .form-group { flex: 1; margin: 0; }
    }

    .tenant-table-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--r-lg);
      overflow: hidden;
      box-shadow: var(--shadow-card);
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
        padding: 14px 20px;
        font-size: 13px;
        border-bottom: 1px solid var(--color-border);
        vertical-align: middle;
      }

      tr:last-child td { border-bottom: none; }
      tr:hover td { background: var(--color-bg); }
    }

    .tenant-name { font-size: 14px; font-weight: 600; }
    .tenant-id   { font-family: var(--font-mono); font-size: 10px; color: var(--color-text-muted); margin-top: 2px; }

    .manage-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-secondary);
      background: var(--color-secondary-light);
      border-radius: var(--r-md);
      padding: 5px 12px;
      text-decoration: none;
      transition: opacity .15s;
      &:hover { opacity: .8; }
      .material-symbols-rounded { font-size: 14px; }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      color: var(--color-text-muted);
      gap: 10px;
      .material-symbols-rounded { font-size: 48px; opacity: .25; }
      p { font-size: 13px; }
    }
  `],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="headline-md">Tenants</h1>
          <p style="color:var(--color-text-muted);font-size:13px;margin-top:2px">
            Create and manage isolated tenants
          </p>
        </div>
      </div>

      <!-- Create tenant -->
      <div class="create-row">
        <div class="form-group">
          <input placeholder="New tenant name (e.g. acme-corp)"
                 [(ngModel)]="newTenantName"
                 (keyup.enter)="createTenant()" />
        </div>
        <button class="btn btn-primary"
                [disabled]="!newTenantName.trim() || creating()"
                (click)="createTenant()">
          @if (creating()) { <div class="spinner"></div> }
          @else { <span class="material-symbols-rounded" style="font-size:18px">add</span> }
          Create Tenant
        </button>
      </div>

      <!-- Tenant list -->
      <div class="tenant-table-card">
        @if (loading()) {
          <div style="padding:48px;text-align:center">
            <div class="spinner" style="margin:0 auto 12px"></div>
            <span style="color:var(--color-text-muted);font-size:13px">Loading tenants…</span>
          </div>
        } @else if (tenants().length === 0) {
          <div class="empty-state">
            <span class="material-symbols-rounded">group_off</span>
            <p>No tenants yet. Create one above to get started.</p>
          </div>
        } @else {
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (t of tenants(); track t.id) {
                <tr>
                  <td>
                    <div class="tenant-name">{{ t.name }}</div>
                    <div class="tenant-id">{{ t.id }}</div>
                  </td>
                  <td style="color:var(--color-text-muted)">{{ t.created_at | date:'d MMM yyyy' }}</td>
                  <td style="text-align:right">
                    <a class="manage-link" [routerLink]="['/tenants', t.id]">
                      Manage
                      <span class="material-symbols-rounded">arrow_forward</span>
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
export class TenantsComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  tenants      = signal<Tenant[]>([]);
  loading      = signal(true);
  creating     = signal(false);
  newTenantName = '';

  ngOnInit() { this.loadTenants(); }

  private loadTenants() {
    this.loading.set(true);
    this.api.listTenants().subscribe({
      next: (ts) => { this.tenants.set(ts); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load tenants — check Settings');
      },
    });
  }

  createTenant() {
    const name = this.newTenantName.trim();
    if (!name) return;
    this.creating.set(true);
    this.api.createTenant(name).subscribe({
      next: (t) => {
        this.newTenantName = '';
        this.creating.set(false);
        this.toast.success(`Tenant "${t.name}" created`);
        this.loadTenants();
      },
      error: (err) => {
        this.creating.set(false);
        this.toast.error(`Failed to create tenant: ${err.message}`);
      },
    });
  }
}
