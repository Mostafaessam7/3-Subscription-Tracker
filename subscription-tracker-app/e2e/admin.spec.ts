import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';

// الباك اند بيشتغل على بورت 5000 محليًا (راجع e2e/README.md) - الفرونت اند مبيعرضش أي UI لعمل
// أول Admin (ده Endpoint مقصود يتنادى مرة واحدة يدوي)، فبنستخدمه هنا مباشرة عن طريق Playwright's
// request API بدل ما نمر بالواجهة
const API_BASE_URL = 'http://localhost:5000/api';
// نفس القيمة الافتراضية في appsettings.json (Admin:BootstrapKey) - غيّرها لو غيّرتها إنت في الباك اند
const BOOTSTRAP_KEY = 'CHANGE_THIS_TO_A_RANDOM_SECRET_BEFORE_FIRST_RUN';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@example.com`;
}

async function ensureAdminCredentials(request: import('@playwright/test').APIRequestContext): Promise<{ email: string; password: string }> {
  const fixedEmail = 'e2e-fixture-admin@example.com';
  const fixedPassword = 'AdminPass123';

  const bootstrapResponse = await request.post(`${API_BASE_URL}/admin/bootstrap`, {
    data: { bootstrapKey: BOOTSTRAP_KEY, name: 'E2E Admin', email: fixedEmail, password: fixedPassword }
  });

  // لو فشل، يبقى غالبًا فيه Admin موجود بالفعل من تشغيل سابق - هنجرب نسجّل دخول بنفس البيانات الثابتة
  if (bootstrapResponse.ok()) {
    return { email: fixedEmail, password: fixedPassword };
  }

  const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email: fixedEmail, password: fixedPassword }
  });

  if (loginResponse.ok()) {
    return { email: fixedEmail, password: fixedPassword };
  }

  throw new Error('مقدرتش أعمل Bootstrap ولا Login لحساب Admin - تأكد إن الباك اند شغال على http://localhost:5000');
}

test.describe('لوحة تحكم الأدمن (End-to-End)', () => {
  test('مستخدم عادي مايقدرش يشوف لينك الأدمن ولا يفتح /admin', async ({ page }) => {
    const email = uniqueEmail('regular');
    await page.goto('/register');
    await page.locator('input[formcontrolname="name"]').fill('Regular User');
    await page.locator('input[formcontrolname="email"]').fill(email);
    await page.locator('input[formcontrolname="password"]').fill('Password123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');

    await expect(page.getByRole('link', { name: /🛠/ })).toHaveCount(0);

    await page.goto('/admin');
    // adminGuard المفروض يمنعه ويرجّعه للداشبورد
    await expect(page).toHaveURL('/');
  });

  test('Admin بيقدر يفتح لوحة التحكم ويشوف الإحصائيات وجدول المستخدمين', async ({ page, request }) => {
    const { email, password } = await ensureAdminCredentials(request);

    await page.goto('/login');
    await page.locator('input[formcontrolname="email"]').fill(email);
    await page.locator('input[formcontrolname="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');

    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('.admin-table')).toBeVisible();
  });
});
