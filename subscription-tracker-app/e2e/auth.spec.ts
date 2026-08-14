import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';

// كل Test بيسجّل مستخدم جديد بإيميل فريد (UUID) عشان الـ Tests تقدر تتشغل بالتوازي من غير تعارض
function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@example.com`;
}

test.describe('التسجيل والدخول', () => {
  test('تسجيل حساب جديد بينجح ويوصل المستخدم للداشبورد', async ({ page }) => {
    const email = uniqueEmail('register');

    await page.goto('/register');
    await page.locator('input[formcontrolname="name"]').fill('Test User');
    await page.locator('input[formcontrolname="email"]').fill(email);
    await page.locator('input[formcontrolname="password"]').fill('Password123');
    await page.locator('button[type="submit"]').click();

    // بعد التسجيل الناجح المفروض يوصل للداشبورد (مش صفحة /login أو /register تاني)
    await expect(page).toHaveURL('/');
  });

  test('تسجيل الدخول بإيميل مش موجود بيفشل ويعرض رسالة خطأ', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[formcontrolname="email"]').fill(uniqueEmail('unknown'));
    await page.locator('input[formcontrolname="password"]').fill('WrongPassword123');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.error')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('تسجيل حساب ثم تسجيل الخروج يرجّع لصفحة /login', async ({ page }) => {
    const email = uniqueEmail('logout');

    await page.goto('/register');
    await page.locator('input[formcontrolname="name"]').fill('Test User');
    await page.locator('input[formcontrolname="email"]').fill(email);
    await page.locator('input[formcontrolname="password"]').fill('Password123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');

    // نفس الحساب بعد الخروج لازم يقدر يدخل تاني بنفس البيانات
    await page.evaluate(() => localStorage.removeItem('subscription_tracker_token'));
    await page.goto('/');
    await expect(page).toHaveURL('/login');

    await page.locator('input[formcontrolname="email"]').fill(email);
    await page.locator('input[formcontrolname="password"]').fill('Password123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');
  });

  test('لينك "نسيت كلمة السر؟" في صفحة الدخول بيودّي لصفحة forgot-password', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /نسيت كلمة السر|forgot password/i }).click();
    await expect(page).toHaveURL('/forgot-password');
  });
});

test.describe('نسيان كلمة السر', () => {
  test('طلب استرجاع كلمة السر بإيميل مسجّل بيعرض رسالة نجاح', async ({ page }) => {
    const email = uniqueEmail('forgot');

    // لازم يكون فيه حساب مسجّل الأول عشان نتأكد إن الـ Flow يشتغل على إيميل حقيقي
    await page.goto('/register');
    await page.locator('input[formcontrolname="name"]').fill('Test User');
    await page.locator('input[formcontrolname="email"]').fill(email);
    await page.locator('input[formcontrolname="password"]').fill('Password123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');

    await page.evaluate(() => localStorage.clear());
    await page.goto('/forgot-password');
    await page.locator('input[formcontrolname="email"]').fill(email);
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.success')).toBeVisible();
  });

  test('صفحة reset-password من غير token بتعرض رسالة خطأ وتمنع الإرسال', async ({ page }) => {
    await page.goto('/reset-password');

    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('صفحة reset-password بتوكن غلط بترجّع خطأ من السيرفر', async ({ page }) => {
    await page.goto('/reset-password?token=not-a-real-token');

    await page.locator('input[formcontrolname="newPassword"]').fill('NewPassword456');
    await page.locator('input[formcontrolname="confirmPassword"]').fill('NewPassword456');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.error')).toBeVisible();
  });
});
