import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@example.com`;
}

async function registerNewUser(page: Page): Promise<string> {
  const email = uniqueEmail('sub');
  await page.goto('/register');
  await page.locator('input[formcontrolname="name"]').fill('Test User');
  await page.locator('input[formcontrolname="email"]').fill(email);
  await page.locator('input[formcontrolname="password"]').fill('Password123');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/');
  return email;
}

async function addSubscription(page: Page, name: string, price: string): Promise<void> {
  // زرار "+ إضافة اشتراك" - وقت النداء ده، مودال تعديل الميزانية لسه مقفول فمفيش .btn-primary تاني في الصفحة
  await page.locator('button.btn-primary').click();
  await page.locator('input[formcontrolname="name"]').fill(name);
  await page.locator('input[formcontrolname="price"]').fill(price);
  await page.locator('form button[type="submit"]').click();
  // .name هو اللينك الفعلي في صف الاشتراك في القائمة - بنستبعد به الـ ticker اللي بيكرر نفس
  // الاسم في أعلى الداشبورد (Strict Mode Violation لو استخدمنا getByText عام على الصفحة كلها)
  await expect(page.locator('a.name', { hasText: name })).toBeVisible();
}

test.describe('إدارة الاشتراكات (End-to-End)', () => {
  test('إضافة اشتراك جديد بيظهر في القائمة على الداشبورد', async ({ page }) => {
    await registerNewUser(page);
    await addSubscription(page, `Netflix E2E ${Date.now()}`, '199');
  });

  test('تعديل اشتراك موجود بيحدّث الاسم في القائمة', async ({ page }) => {
    await registerNewUser(page);
    const originalName = `Spotify E2E ${Date.now()}`;
    await addSubscription(page, originalName, '50');

    const row = page.locator('.row', { hasText: originalName });
    await row.getByTitle('تعديل').click();

    const updatedName = `${originalName} - Updated`;
    await page.locator('input[formcontrolname="name"]').fill(updatedName);
    await page.locator('form button[type="submit"]').click();

    await expect(page.locator('a.name', { hasText: updatedName })).toBeVisible();
  });

  test('حذف اشتراك بعد التأكيد بيشيله من القائمة', async ({ page }) => {
    await registerNewUser(page);
    const subscriptionName = `ToDelete E2E ${Date.now()}`;
    await addSubscription(page, subscriptionName, '75');

    const row = page.locator('.row', { hasText: subscriptionName });
    await row.getByTitle('حذف الاشتراك').click();

    // حوار التأكيد المخصص بتاع التطبيق (بديل confirm() الافتراضية) - بيحتوي زرار "حذف الاشتراك"
    // (لازم getByRole مش getByText - نص رسالة التأكيد نفسه بيحتوي "حذف الاشتراك" كـ Substring)
    await page.locator('.confirm-card').getByRole('button', { name: 'حذف الاشتراك' }).click();

    await expect(page.locator('a.name', { hasText: subscriptionName })).not.toBeVisible();
  });

  test('إلغاء حوار التأكيد بيسيب الاشتراك زي ما هو', async ({ page }) => {
    await registerNewUser(page);
    const subscriptionName = `KeepMe E2E ${Date.now()}`;
    await addSubscription(page, subscriptionName, '30');

    const row = page.locator('.row', { hasText: subscriptionName });
    await row.getByTitle('حذف الاشتراك').click();
    await page.locator('.confirm-card').getByRole('button', { name: 'إلغاء' }).click();

    await expect(page.locator('a.name', { hasText: subscriptionName })).toBeVisible();
  });
});
