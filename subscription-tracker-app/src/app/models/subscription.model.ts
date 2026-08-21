// بيطابق BillingCycle في C# - القيم لازم تفضل بنفس الترتيب بالظبط (Weekly/Quarterly اتضافوا في الآخر)
export enum BillingCycle {
  Monthly = 0,
  Yearly = 1,
  Weekly = 2,
  Quarterly = 3
}

// بيطابق SubscriptionStatus في C#
export enum SubscriptionStatus {
  Active = 0,
  Expired = 1,
  Cancelled = 2
}

// بيطابق UserRole في C# (Domain/Enums/UserRole.cs)
export enum UserRole {
  User = 0,
  Admin = 1
}

// بيطابق Currency enum في C#
export enum Currency {
  EGP = 0,
  USD = 1,
  EUR = 2,
  GBP = 3,
  SAR = 4,
  AED = 5
}

// بيطابق PaymentMethodType في C#
export enum PaymentMethodType {
  Card = 0,
  Wallet = 1,
  Bank = 2,
  Cash = 3
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export interface CreateCategory {
  name: string;
  color: string;
  icon: string;
}

export type UpdateCategory = CreateCategory;

export interface PaymentMethod {
  id: number;
  name: string;
  type: PaymentMethodType;
}

export interface CreatePaymentMethod {
  name: string;
  type: PaymentMethodType;
}

export type UpdatePaymentMethod = CreatePaymentMethod;

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface CreateTag {
  name: string;
  color: string;
}

export type UpdateTag = CreateTag;

// شكل البيانات اللي بتيجي من الـ API (بيطابق SubscriptionDto في C#)
export interface Subscription {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency: Currency;
  billingCycle: BillingCycle;
  startDate: string | null;
  nextRenewalDate: string;
  autoRenew: boolean;
  websiteUrl: string | null;
  notes: string | null;
  status: SubscriptionStatus;
  isFavorite: boolean;
  icon: string | null;
  daysUntilRenewal: number;
  category: Category | null;
  paymentMethod: PaymentMethod | null;
  tags: Tag[];
}

// شكل البيانات اللي بتتبعت عشان تضيف اشتراك جديد
export interface CreateSubscription {
  name: string;
  description: string | null;
  price: number;
  currency: Currency;
  billingCycle: BillingCycle;
  startDate: string | null;
  nextRenewalDate: string;
  autoRenew: boolean;
  websiteUrl: string | null;
  notes: string | null;
  isFavorite: boolean;
  icon: string | null;
  categoryId: number | null;
  paymentMethodId: number | null;
  tagIds: number[];
  userId: number;
}

// شكل البيانات اللي بتتبعت عشان تعدّل اشتراك موجود
export interface UpdateSubscription {
  name: string;
  description: string | null;
  price: number;
  currency: Currency;
  billingCycle: BillingCycle;
  startDate: string | null;
  nextRenewalDate: string;
  autoRenew: boolean;
  websiteUrl: string | null;
  notes: string | null;
  isFavorite: boolean;
  icon: string | null;
  categoryId: number | null;
  paymentMethodId: number | null;
  tagIds: number[];
  status: SubscriptionStatus;
}

// معايير البحث والفلترة والترتيب (بتتبعت كـ query params للـ API)
export interface SubscriptionQuery {
  search?: string;
  status?: SubscriptionStatus;
  billingCycle?: BillingCycle;
  categoryId?: number;
  tagId?: number;
  onlyFavorites?: boolean;
  renewalFrom?: string;
  renewalTo?: string;
  sortBy?: 'RenewalDate' | 'Cost' | 'Name';
  sortDescending?: boolean;
}

export interface CategorySpending {
  categoryName: string;
  color: string;
  icon: string;
  monthlyTotal: number;
  subscriptionCount: number;
}

export interface TopExpensiveSubscription {
  id: number;
  name: string;
  monthlyEquivalent: number;
  categoryIcon: string | null;
}

export interface AnalyticsInsights {
  averageMonthlyCost: number;
  mostExpensive: TopExpensiveSubscription | null;
  cheapest: TopExpensiveSubscription | null;
  potentialYearlySavingsIfAllCancelled: number;
  top5MostExpensive: TopExpensiveSubscription[];
}

export interface Profile {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface UpdateProfile {
  name: string;
}

export interface DeleteAccount {
  password: string;
}

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
}
