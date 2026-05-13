import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ConfigService } from '../core/services/config.service';
import { ApiService } from '../core/services/api.service';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styles: [`
    :host { display: contents; }

    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: var(--sidebar-w);
      background: var(--color-sidebar-bg);
      display: flex;
      flex-direction: column;
      z-index: 10;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,.08);

      .logo {
        width: 32px;
        height: 32px;
        background: var(--color-primary);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        font-size: 14px;
        flex-shrink: 0;
      }

      .brand-text {
        .name { font-size: 13px; font-weight: 700; color: #fff; line-height: 1.2; }
        .version { font-size: 10px; color: var(--color-sidebar-text-dim); }
      }
    }

    .nav {
      flex: 1;
      padding: 12px 0;
      overflow-y: auto;
    }

    .nav-section {
      padding: 12px 16px 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: var(--color-sidebar-text-dim);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 16px;
      color: var(--color-sidebar-text);
      font-size: 13px;
      font-weight: 500;
      border-radius: 0;
      transition: background .15s;
      cursor: pointer;

      .material-symbols-rounded { font-size: 20px; }

      &:hover { background: rgba(255,255,255,.07); }

      &.active {
        background: var(--color-sidebar-active);
        color: #fff;
        font-weight: 600;
      }
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid rgba(255,255,255,.08);
      font-size: 11px;
      color: var(--color-sidebar-text-dim);
    }

    .token-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: rgba(255,255,255,.06);
      border-radius: 6px;
      margin-top: 8px;
      font-size: 11px;
      color: var(--color-sidebar-text);

      .material-symbols-rounded { font-size: 14px; color: var(--color-sidebar-text-dim); }
    }

    .api-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      background: rgba(255,255,255,.04);
      border-radius: 6px;
      font-size: 11px;
      color: var(--color-sidebar-text-dim);

      .status-dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
        &-online   { background: #4ade80; box-shadow: 0 0 0 2px rgba(74,222,128,.25); }
        &-offline  { background: #f87171; }
        &-checking { background: #facc15; animation: pulse 1.2s infinite; }
      }

      .status-text { flex: 1; }
      .latency { font-family: var(--font-mono); opacity: .7; }
    }

    @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
  `],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">SG</div>
        <div class="brand-text">
          <div class="name">Storage Gateway</div>
          <div class="version">Admin Console</div>
        </div>
      </div>

      <nav class="nav">
        <div class="nav-section">Main</div>
        @for (item of navItems; track item.path) {
          <a class="nav-item"
             [routerLink]="item.path"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }">
            <span class="material-symbols-rounded">{{ item.icon }}</span>
            {{ item.label }}
          </a>
        }
      </nav>

      <div class="sidebar-footer">
        <div class="api-status">
          <span class="status-dot status-dot-{{ apiStatus() }}"></span>
          <span class="status-text">{{ apiStatusLabel() }}</span>
          @if (latency() !== null) {
            <span class="latency">{{ latency() }}ms</span>
          }
        </div>
        <div class="token-badge">
          <span class="material-symbols-rounded">key</span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            {{ tokenPreview() }}
          </span>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent implements OnInit, OnDestroy {
  private config = inject(ConfigService);
  private api = inject(ApiService);

  navItems: NavItem[] = [
    { path: '/dashboard', icon: 'dashboard',  label: 'Dashboard' },
    { path: '/tenants',   icon: 'group',       label: 'Tenants' },
    { path: '/settings',  icon: 'settings',    label: 'Settings' },
  ];

  apiStatus = signal<'checking' | 'online' | 'offline'>('checking');
  latency = signal<number | null>(null);

  apiStatusLabel() {
    const s = this.apiStatus();
    if (s === 'online')   return 'API connected';
    if (s === 'offline')  return 'API unreachable';
    return 'Connecting…';
  }

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.probe();
    this.pollTimer = setInterval(() => this.probe(), 30_000);
  }

  ngOnDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  private probe() {
    const start = Date.now();
    this.api.healthAdmin().subscribe({
      next: () => {
        this.apiStatus.set('online');
        this.latency.set(Date.now() - start);
      },
      error: () => {
        this.apiStatus.set('offline');
        this.latency.set(null);
      },
    });
  }

  tokenPreview() {
    const t = this.config.adminToken();
    if (!t) return 'No token set';
    return t.length > 16 ? `${t.slice(0, 8)}…${t.slice(-4)}` : t;
  }
}
