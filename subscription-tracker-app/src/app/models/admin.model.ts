import { UserRole } from './subscription.model';

// بيطابق AdminUserDto في C#
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  subscriptionsCount: number;
  monthlySpend: number;
}

// بيطابق SystemStatsDto في C#
export interface SystemStats {
  totalUsers: number;
  totalActiveSubscriptions: number;
  totalMonthlySpendAcrossAllUsers: number;
  newUsersLast30Days: number;
}

// بيطابق UpdateUserRoleDto في C#
export interface UpdateUserRole {
  role: UserRole;
}
