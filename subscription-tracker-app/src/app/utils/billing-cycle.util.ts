import { BillingCycle } from '../models/subscription.model';

// نفس منطق BillingCycleHelper.cs في الباك اند بالظبط - مكان واحد بس عشان لو ضفنا دورة دفع جديدة
// نعدّل هنا بس مش نلاقي الحساب متكرر وغلط في أماكن مختلفة (زي ما حصل فعليًا قبل ما نصلحه في P2)

export function toMonthlyEquivalent(price: number, cycle: BillingCycle): number {
  switch (cycle) {
    case BillingCycle.Weekly: return (price * 52) / 12;
    case BillingCycle.Monthly: return price;
    case BillingCycle.Quarterly: return price / 3;
    case BillingCycle.Yearly: return price / 12;
    default: return price;
  }
}

export function toYearlyEquivalent(price: number, cycle: BillingCycle): number {
  switch (cycle) {
    case BillingCycle.Weekly: return price * 52;
    case BillingCycle.Monthly: return price * 12;
    case BillingCycle.Quarterly: return price * 4;
    case BillingCycle.Yearly: return price;
    default: return price * 12;
  }
}

export function billingCycleKey(cycle: BillingCycle): string {
  switch (cycle) {
    case BillingCycle.Weekly: return 'list.weekly';
    case BillingCycle.Quarterly: return 'list.quarterly';
    case BillingCycle.Yearly: return 'list.yearly';
    default: return 'list.monthly';
  }
}
