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

// التوكن مبقاش بيتخزن في المتصفح خالص — بقى في كوكي HttpOnly السيرفر بيحطها، ومش مقروءة من
// JavaScript. الـ KEY ده فاضل عشان بس ننضف أي قيمة قديمة من متصفحات كانت شغالة على النسخة
// القديمة، وإلا التوكن القديم هيفضل قاعد في localStorage للأبد.
const LEGACY_TOKEN_KEY = 'subscription_tracker_token';

// بيانات عرض (اسم، دور، تاريخ انتهاء) — مش بيانات اعتماد. الفرونت اند بيرسم بيها الواجهة، لكن
// السيرفر بيتحقق من الكوكي في كل طلب بشكل مستقل، فالعبث بالقيمة دي بيغيّر شكل الواجهة بس ومش
// بيدي أي صلاحية حقيقية.
const USER_KEY = 'subscription_tracker_user';

const CSRF_COOKIE = 'XSRF-TOKEN';

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
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, dto, { withCredentials: true, headers: { 'X-Auth-Transport': 'cookie' } }).pipe(
      tap((response) => this.storeSession(response))
    );
  }

  login(dto: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, dto, { withCredentials: true, headers: { 'X-Auth-Transport': 'cookie' } }).pipe(
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
    this.clearLocalSession();

    // كوكي الـ HttpOnly مش ممكن الفرونت اند يمسحها — السيرفر بس هو اللي يقدر. من غير النداء ده
    // المستخدم هيبان إنه خرج من الحساب بينما الكوكي لسه صالحة وشغالة.
    this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true }).subscribe({
      error: () => {},
      complete: () => {}
    });

    this.router.navigate(['/login']);
  }

  /**
   * الفرونت اند مبقاش يقدر يقرا التوكن (وده المقصود)، فصلاحية الجلسة بتتحدد من بيانات المستخدم
   * المخزنة وتاريخ انتهائها. لو حد عبث بالقيمة دي، السيرفر هيرفض طلباته بـ 401 عادي — يعني هيشوف
   * واجهة فاضية، مش صلاحيات.
   */
  isLoggedIn(): boolean {
    const user = this.currentUser();
    if (!user) return false;

    if (new Date(user.expiresAt) < new Date()) {
      this.clearLocalSession();
      return false;
    }

    return true;
  }

  private storeSession(response: AuthResponse): void {
    // التوكن نفسه مش بيتخزن: بيجي في كوكي HttpOnly من السيرفر، والـ Body بيرجع فاضي مكانه.
    localStorage.setItem(USER_KEY, JSON.stringify(response));
    this.currentUser.set(response);
  }

  /** الكوكي دي مقصود إنها مقروءة من السكريبت: الفرونت اند بيرجّعها في Header وده أساس الـ double-submit. */
  getCsrfToken(): string | null {
    // Regex literal, not a constructed string: `\s` inside a normal string literal collapses to a
    // plain "s", which would silently match ";s*" and never find the cookie.
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private clearLocalSession(): void {
    localStorage.removeItem(USER_KEY);

    // تنضيف قيمة النسخة القديمة: متصفح كان شغال على البناء القديم لسه شايل توكن في localStorage.
    localStorage.removeItem(LEGACY_TOKEN_KEY);

    this.currentUser.set(null);
  }

  private loadStoredUser(): AuthResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
