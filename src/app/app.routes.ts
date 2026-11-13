import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { adminGuard } from './core/auth/guards/admin.guard';
export const routes: Routes = [
  {
    path: 'login',
    title: 'CoreDesk | Enterprise Management',
    loadComponent: () =>
      import('./features/login/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        title: 'CoreDesk | Enterprise Management',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'users',
        title: 'CoreDesk | Enterprise Management',
        loadComponent: () =>
          import('./features/users/pages/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'roles',
        title: 'CoreDesk | Enterprise Management',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/roles/pages/roles/roles.component').then((m) => m.RolesComponent),
      },
      {
        path: 'activity',
        title: 'CoreDesk | Enterprise Management',
        loadComponent: () =>
          import('./features/activity/pages/activity/activity.component').then(
            (m) => m.ActivityComponent,
          ),
      },
      {
        path: 'settings',
        title: 'CoreDesk | Enterprise Management',
        loadComponent: () =>
          import('./features/settings/pages/settings/settings.component').then(
            (m) => m.SettingsComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
