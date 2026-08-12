import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Budget {
  monthlyBudget: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/users`;

  getBudget(userId: number): Observable<Budget> {
    return this.http.get<Budget>(`${this.baseUrl}/${userId}/budget`);
  }

  setBudget(userId: number, monthlyBudget: number | null): Observable<Budget> {
    return this.http.put<Budget>(`${this.baseUrl}/${userId}/budget`, { monthlyBudget });
  }
}
