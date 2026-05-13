import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
  },
  {
    path: 'tenants',
    loadComponent: () => import('./features/tenants/tenants').then(m => m.TenantsComponent),
  },
  {
    path: 'tenants/:id',
    loadComponent: () => import('./features/tenants/tenant-detail').then(m => m.TenantDetailComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then(m => m.SettingsComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
