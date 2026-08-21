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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ConfirmEmailRequest {
  token: string;
}

export interface ResendConfirmationRequest {
  email: string;
}

// شكل الرد بعد نجاح الدخول أو التسجيل (بيطابق AuthResponseDto في C#)
export interface AuthResponse {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  emailConfirmed: boolean;
  token: string;
  expiresAt: string;
}
