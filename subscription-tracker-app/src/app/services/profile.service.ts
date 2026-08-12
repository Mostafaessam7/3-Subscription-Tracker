import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChangePassword, Profile, UpdateProfile } from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/users`;

  getProfile(userId: number): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/${userId}`);
  }

  updateProfile(userId: number, dto: UpdateProfile): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/${userId}`, dto);
  }

  changePassword(userId: number, dto: ChangePassword): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${userId}/password`, dto);
  }
}
