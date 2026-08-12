import { BillingCycle } from '../models/subscription.model';
import { billingCycleKey, toMonthlyEquivalent, toYearlyEquivalent } from './billing-cycle.util';

// بيتأكد إن منطق التحويل هنا مطابق بالظبط لـ BillingCycleHelper.cs في الباك اند (نفس الملف اللي
// السبب في الـ Bug اللي اتصلح في P2 - راجع README الرئيسي)
describe('billing-cycle.util', () => {
  describe('toMonthlyEquivalent', () => {
    it('يرجّع نفس القيمة لدورة شهرية', () => {
      expect(toMonthlyEquivalent(100, BillingCycle.Monthly)).toBe(100);
    });

    it('يقسّم على 12 لدورة سنوية', () => {
      expect(toMonthlyEquivalent(1200, BillingCycle.Yearly)).toBe(100);
    });

    it('يقسّم على 3 لدورة ربع سنوية', () => {
      expect(toMonthlyEquivalent(300, BillingCycle.Quarterly)).toBe(100);
    });

    it('يحسب (سعر * 52 / 12) لدورة أسبوعية', () => {
      expect(toMonthlyEquivalent(100, BillingCycle.Weekly)).toBeCloseTo(433.33, 2);
    });
  });

  describe('toYearlyEquivalent', () => {
    it('يضرب في 12 لدورة شهرية', () => {
      expect(toYearlyEquivalent(100, BillingCycle.Monthly)).toBe(1200);
    });

    it('يرجّع نفس القيمة لدورة سنوية', () => {
      expect(toYearlyEquivalent(1200, BillingCycle.Yearly)).toBe(1200);
    });

    it('يضرب في 4 لدورة ربع سنوية', () => {
      expect(toYearlyEquivalent(100, BillingCycle.Quarterly)).toBe(400);
    });

    it('يضرب في 52 لدورة أسبوعية', () => {
      expect(toYearlyEquivalent(100, BillingCycle.Weekly)).toBe(5200);
    });
  });

  describe('billingCycleKey', () => {
    it('يرجّع مفتاح الترجمة الصحيح لكل دورة', () => {
      expect(billingCycleKey(BillingCycle.Monthly)).toBe('list.monthly');
      expect(billingCycleKey(BillingCycle.Yearly)).toBe('list.yearly');
      expect(billingCycleKey(BillingCycle.Weekly)).toBe('list.weekly');
      expect(billingCycleKey(BillingCycle.Quarterly)).toBe('list.quarterly');
    });
  });
});
