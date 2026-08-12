import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CategorySpending, AnalyticsInsights } from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/analytics`;

  getSpendingByCategory(userId: number): Observable<CategorySpending[]> {
    return this.http.get<CategorySpending[]>(`${this.baseUrl}/spending-by-category/${userId}`);
  }

  getInsights(userId: number): Observable<AnalyticsInsights> {
    return this.http.get<AnalyticsInsights>(`${this.baseUrl}/insights/${userId}`);
  }
}
