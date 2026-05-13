import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="modal-backdrop" (click)="cancelled.emit()">
      <div class="modal" (click)="$event.stopPropagation()" style="max-width:400px">
        <div class="modal-header">
          <h2>{{ title() }}</h2>
          <button class="btn btn-ghost" (click)="cancelled.emit()">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
        <div class="modal-body">
          <p style="color:var(--color-text-muted)">{{ message() }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="cancelled.emit()">Cancel</button>
          <button class="btn btn-danger" (click)="confirmed.emit()">{{ confirmLabel() }}</button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  title   = input('Confirm');
  message = input('Are you sure?');
  confirmLabel = input('Delete');
  confirmed = output<void>();
  cancelled = output<void>();
}
