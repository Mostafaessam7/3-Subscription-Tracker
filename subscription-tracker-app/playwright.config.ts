import { defineConfig, devices } from '@playwright/test';

// إعدادات Playwright لتشغيل الـ E2E Tests على النظام كامل (Frontend حقيقي بيكلم Backend حقيقي).
// محتاج الباك اند يكون شغال على http://localhost:5000 قبل ما تشغّل الأوامر دي (راجع e2e/README.md).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 1,
  // مقصود قليل ومش undefined (كل الأنوية): كل Test بيسجّل مستخدم فعليًا، وتسجيل مستخدم بيعمل
  // BCrypt Hash (متعمّد إنه بطيء) - تشغيل Workers كتير مع بعض بيخنق الـ Backend/DB المحلية
  // وبيسبب Timeouts وهمية مالهاش علاقة بصحة الـ Tests نفسها
  workers: 2,
  timeout: 45 * 1000,
  // Default الـ expect() هو 5 ثواني بس - قليل لما كذا Test بيسجّلوا مستخدمين بالتوازي (BCrypt
  // بطيء عمدًا)، فطلب register ممكن ياخد أكتر من 5 ثواني تحت ضغط من غير ما يبقى فيه مشكلة حقيقية.
  // 15 ثانية بتدّي هامش كافي من غير ما تخلي Test حقيقي فاشل يستنى كتير قبل ما يفشل
  expect: { timeout: 15 * 1000 },
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  // بيشغّل سيرفر الفرونت اند تلقائيًا لو مش شغال بالفعل - الباك اند لازم يتشغّل يدوي (راجع e2e/README.md)
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120 * 1000
  }
});
