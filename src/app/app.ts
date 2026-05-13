import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layout/sidebar';
import { ToastComponent } from './shared/components/toast/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ToastComponent],
  styleUrl: './app.scss',
  template: `
    <app-sidebar />
    <main class="main-content">
      <router-outlet />
    </main>
    <app-toast />
  `,
})
export class App {}
