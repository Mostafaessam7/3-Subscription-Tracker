import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

// كل الـ Routes بقت Lazy-Loaded (loadComponent) ماعدا Dashboard - عشان الـ Bundle الابتدائي
// ميشيلش كود صفحات زي Reports (اللي بتجيب jspdf/canvg التقيلين) أو Admin قبل ما المستخدم يزورهم فعلًا.
// Dashboard فضلت Eager (Import مباشر) لأنها الصفحة الافتراضية اللي كل مستخدم Login بيوصلها فورًا -
// خليها Lazy كانت بتضيف تأخير ملحوظ (خصوصًا في Dev Server) أول ما حد يسجّل/يدخل.
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/register/register.component').then((m) => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./components/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./components/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent) },
  { path: 'confirm-email', loadComponent: () => import('./components/confirm-email/confirm-email.component').then((m) => m.ConfirmEmailComponent) },
  {
    path: 'subscriptions/:id',
    loadComponent: () => import('./components/subscription-detail/subscription-detail.component').then((m) => m.SubscriptionDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reports',
    loadComponent: () => import('./components/reports/reports.component').then((m) => m.ReportsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'calendar',
    loadComponent: () => import('./components/calendar-view/calendar-view.component').then((m) => m.CalendarViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin.component').then((m) => m.AdminComponent),
    canActivate: [adminGuard]
  },
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
