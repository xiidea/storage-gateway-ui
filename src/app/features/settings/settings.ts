import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfigService } from '../../core/services/config.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    .page { padding: 32px; max-width: 640px; }
    .page-header { margin-bottom: 28px; }
  `],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="headline-md">Settings</h1>
        <p style="color:var(--color-text-muted);font-size:13px;margin-top:2px">
          Connection and authentication settings — stored in browser localStorage
        </p>
      </div>

      <div class="card">
        <div class="card-header"><h3>Admin API Connection</h3></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:16px">
          <div class="form-group">
            <label>Admin API URL</label>
            <input [(ngModel)]="apiUrl" placeholder="http://localhost:9001" />
            <span class="hint">Base URL of the admin API (e.g. http://localhost:9001). CORS must be enabled on the server.</span>
          </div>

          <div class="form-group">
            <label>Admin Token</label>
            <input type="password" [(ngModel)]="adminToken" placeholder="Your ADMIN_TOKEN value" />
            <span class="hint">Bearer token required for all admin API requests (set via ADMIN_TOKEN env var)</span>
          </div>

          <div>
            <button class="btn btn-primary" (click)="save()">
              <span class="material-symbols-rounded" style="font-size:18px">save</span>
              Save & Apply
            </button>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-header"><h3>Consumer SDK Setup</h3></div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:12px">
            Configure your AWS SDK to point at the S3 gateway on port 8080:
          </p>
          <pre class="code-mono" style="background:var(--color-bg);padding:12px;border-radius:var(--r-md);border:1px solid var(--color-border);overflow-x:auto;font-size:12px;line-height:1.6">aws s3 ls s3://my-bucket/ \
  --endpoint-url {{ s3Url() }} \
  --region us-east-1</pre>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  private config = inject(ConfigService);
  private toast = inject(ToastService);

  apiUrl = this.config.apiUrl();
  adminToken = this.config.adminToken();

  s3Url() {
    return this.config.apiUrl().replace(/:\d+$/, ':8080');
  }

  save() {
    this.config.setApiUrl(this.apiUrl.trim() || 'http://localhost:9001');
    this.config.setToken(this.adminToken.trim());
    this.toast.success('Settings saved');
  }
}
