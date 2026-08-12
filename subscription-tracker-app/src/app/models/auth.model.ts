import { UserRole } from './subscription.model';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// شكل الرد بعد نجاح الدخول أو التسجيل (بيطابق AuthResponseDto في C#)
export interface AuthResponse {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  token: string;
  expiresAt: string;
}
