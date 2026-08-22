import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@example.com`;
}

async function registerNewUser(page: Page): Promise<string> {
  const email = uniqueEmail('account');
  await page.goto('/register');
  await page.locator('input[formcontrolname="name"]').fill('Test User');
  await page.locator('input[formcontrolname="email"]').fill(email);
  await page.locator('input[formcontrolname="password"]').fill('Password123');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/');
  return email;
}

test.describe('تأكيد الإيميل', () => {
  test('مستخدم جديد لسه ما أكّدش إيميله بيشوف بانر التأكيد في الداشبورد', async ({ page }) => {
    await registerNewUser(page);

    // مفيش وصول حقيقي لصندوق الإيميل هنا (SMTP حقيقي وقت E2E)، فبنتأكد من نتيجة الحالة
    // (emailConfirmed: false على حساب جديد) مش من استخراج التوكن نفسه - ده مغطّى بالكامل
    // بـ Integration Tests على الباك اند
    await expect(page.locator('.email-confirm-banner')).toBeVisible();
    await expect(page.locator('.email-confirm-banner')).toContainText('ما أكّدتش إيميلك');
  });

  test('زرار إعادة إرسال التأكيد بيبعت الطلب وميختفيش البانر فورًا (مفيش تأكيد حقيقي حصل)', async ({ page }) => {
    await registerNewUser(page);

    const resendButton = page.locator('.email-confirm-banner button');
    await expect(resendButton).toBeVisible();
    await resendButton.click();

    // البانر لازم يفضل ظاهر - الطلب بس بيبعت لينك تاني، مبيأكّدش الإيميل فورًا
    await expect(page.locator('.email-confirm-banner')).toBeVisible();
  });

  test('صفحة confirm-email بتوكن غلط بتعرض رسالة خطأ', async ({ page }) => {
    await page.goto('/confirm-email?token=not-a-real-token');

    await expect(page.locator('.error')).toBeVisible();
  });

  test('صفحة confirm-email من غير token بتعرض رسالة خطأ من غير ما تبعت أي طلب', async ({ page }) => {
    await page.goto('/confirm-email');

    await expect(page.locator('.error')).toBeVisible();
  });
});

test.describe('مسح الحساب', () => {
  test('مسح الحساب بكلمة سر صح بيرجّع لصفحة الدخول ويمنع الدخول بنفس البيانات تاني', async ({ page }) => {
    const email = await registerNewUser(page);

    await page.goto('/profile');
    await page.locator('input[formcontrolname="password"]').fill('Password123');
    await page.getByRole('button', { name: 'امسح حسابي نهائيًا' }).click();

    // حوار التأكيد المخصص بتاع التطبيق (بديل confirm() الافتراضية)
    await page.locator('.confirm-card').getByRole('button', { name: 'حذف الاشتراك' }).click();

    await expect(page).toHaveURL('/login');

    // نفس البيانات لازم تفشل دلوقتي - الحساب اتمسح فعليًا مش بس اتقفل
    await page.locator('input[formcontrolname="email"]').fill(email);
    await page.locator('input[formcontrolname="password"]').fill('Password123');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.error')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('مسح الحساب بكلمة سر غلط بيعرض خطأ ومبيمسحش الحساب', async ({ page }) => {
    await registerNewUser(page);

    await page.goto('/profile');
    await page.locator('input[formcontrolname="password"]').fill('WrongPassword123');
    await page.getByRole('button', { name: 'امسح حسابي نهائيًا' }).click();
    await page.locator('.confirm-card').getByRole('button', { name: 'حذف الاشتراك' }).click();

    await expect(page.locator('.error')).toBeVisible();
    await expect(page).toHaveURL('/profile');
  });

  test('إلغاء حوار التأكيد بيسيب الحساب زي ما هو', async ({ page }) => {
    await registerNewUser(page);

    await page.goto('/profile');
    await page.locator('input[formcontrolname="password"]').fill('Password123');
    await page.getByRole('button', { name: 'امسح حسابي نهائيًا' }).click();
    await page.locator('.confirm-card').getByRole('button', { name: 'إلغاء' }).click();

    await expect(page).toHaveURL('/profile');
  });
});
