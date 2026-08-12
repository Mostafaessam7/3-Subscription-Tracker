import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaymentMethod, CreatePaymentMethod, UpdatePaymentMethod } from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/paymentmethods`;

  getAll(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(this.baseUrl);
  }

  create(dto: CreatePaymentMethod): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(this.baseUrl, dto);
  }

  update(id: number, dto: UpdatePaymentMethod): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
