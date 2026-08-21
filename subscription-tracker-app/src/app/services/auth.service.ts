import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthResponse,
  ConfirmEmailRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResendConfirmationRequest,
  ResetPasswordRequest
} from '../models/auth.model';

const TOKEN_KEY = 'subscription_tracker_token';
const USER_KEY = 'subscription_tracker_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = `${environment.apiUrl}/auth`;

  // Signal بيحمل بيانات المستخدم الحالي، عشان أي جزء في التطبيق يقدر يتابعه
  currentUser = signal<AuthResponse | null>(this.loadStoredUser());

  register(dto: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, dto).pipe(
      tap((response) => this.storeSession(response))
    );
  }

  login(dto: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, dto).pipe(
      tap((response) => this.storeSession(response))
    );
  }

  // بيرجع 200 دايمًا من الباك اند (حتى لو الإيميل مش مسجل) - عشان محدش يقدر يكتشف الإيميلات المسجلة
  forgotPassword(dto: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/forgot-password`, dto);
  }

  resetPassword(dto: ResetPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, dto);
  }

  confirmEmail(dto: ConfirmEmailRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/confirm-email`, dto);
  }

  // بيرجع 200 دايمًا من الباك اند (حتى لو الإيميل مش مسجل أو متأكد بالفعل)
  resendConfirmation(dto: ResendConfirmationRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/resend-confirmation`, dto);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const user = this.currentUser();
    if (user && new Date(user.expiresAt) < new Date()) {
      this.logout();
      return false;
    }
    return true;
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response));
    this.currentUser.set(response);
  }

  private loadStoredUser(): AuthResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
