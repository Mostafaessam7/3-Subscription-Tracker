import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/subscription.model';

// بيمنع فتح /admin لغير المستخدمين اللي دورهم Admin - نفس الفحص اللي الباك اند بيعمله
// (403) على [Authorize(Roles = "Admin")]، هنا بس على مستوى الـ Route قبل حتى ما نبعت أي Request
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.currentUser()?.role !== UserRole.Admin) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
