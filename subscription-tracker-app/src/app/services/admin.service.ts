import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdminUser, SystemStats, UpdateUserRole } from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin`;

  // GET: كل المستخدمين + عدد اشتراكاتهم ومصروفهم الشهري - Admin بس (403 لغيره)
  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.baseUrl}/users`);
  }

  // GET: إحصائيات عامة عن النظام كله
  getStats(): Observable<SystemStats> {
    return this.http.get<SystemStats>(`${this.baseUrl}/stats`);
  }

  // PUT: ترقية/تخفيض دور مستخدم
  updateUserRole(userId: number, dto: UpdateUserRole): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/users/${userId}/role`, dto);
  }
}
