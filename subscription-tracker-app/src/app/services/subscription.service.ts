import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Subscription, CreateSubscription, UpdateSubscription, SubscriptionQuery } from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/subscriptions`;

  // GET: كل اشتراكات مستخدم معين، مع دعم البحث والفلترة والترتيب
  getAllForUser(userId: number, query?: SubscriptionQuery): Observable<Subscription[]> {
    let params = new HttpParams();

    if (query?.search) params = params.set('search', query.search);
    if (query?.status !== undefined) params = params.set('status', query.status);
    if (query?.billingCycle !== undefined) params = params.set('billingCycle', query.billingCycle);
    if (query?.categoryId !== undefined) params = params.set('categoryId', query.categoryId);
    if (query?.tagId !== undefined) params = params.set('tagId', query.tagId);
    if (query?.onlyFavorites !== undefined) params = params.set('onlyFavorites', query.onlyFavorites);
    if (query?.renewalFrom) params = params.set('renewalFrom', query.renewalFrom);
    if (query?.renewalTo) params = params.set('renewalTo', query.renewalTo);
    if (query?.sortBy) params = params.set('sortBy', query.sortBy);
    if (query?.sortDescending !== undefined) params = params.set('sortDescending', query.sortDescending);

    return this.http.get<Subscription[]>(`${this.baseUrl}/user/${userId}`, { params });
  }

  // GET: اشتراك واحد بالتفصيل
  getById(id: number): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.baseUrl}/${id}`);
  }

  // POST: إضافة اشتراك جديد
  create(dto: CreateSubscription): Observable<Subscription> {
    return this.http.post<Subscription>(this.baseUrl, dto);
  }

  // PUT: تعديل اشتراك موجود
  update(id: number, dto: UpdateSubscription): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, dto);
  }

  // DELETE: حذف اشتراك
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // POST: عمل نسخة من اشتراك موجود
  duplicate(id: number): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.baseUrl}/${id}/duplicate`, {});
  }

  // بيقلب حالة المفضلة - بيبني الـ payload الكامل من الاشتراك نفسه (مفيش Endpoint منفصل للـ toggle بس)
  toggleFavorite(sub: Subscription): Observable<void> {
    const dto: UpdateSubscription = {
      name: sub.name,
      description: sub.description,
      price: sub.price,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      startDate: sub.startDate,
      nextRenewalDate: sub.nextRenewalDate,
      autoRenew: sub.autoRenew,
      isFavorite: !sub.isFavorite,
      websiteUrl: sub.websiteUrl,
      notes: sub.notes,
      categoryId: sub.category?.id ?? null,
      paymentMethodId: sub.paymentMethod?.id ?? null,
      status: sub.status,
      tagIds: sub.tags.map((t) => t.id),
      icon: sub.icon
    };
    return this.update(sub.id, dto);
  }

  // GET: إجمالي المصروف الشهري
  getMonthlyTotal(userId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/user/${userId}/monthly-total`);
  }
}
