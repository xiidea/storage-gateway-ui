import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [],
  template: `
    <div class="toast-container">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast toast-{{t.type}}">
          <span class="material-symbols-rounded">
            {{ t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info' }}
          </span>
          <span>{{ t.message }}</span>
          <button class="btn btn-ghost btn-sm" style="margin-left:auto;color:inherit" (click)="toast.dismiss(t.id)">
            <span class="material-symbols-rounded" style="font-size:16px">close</span>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  toast = inject(ToastService);
}
