import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';

/**
 * فحص سلوك الـ dialogs من ناحية الكيبورد وقارئ الشاشة.
 *
 * ليه ملف لوحده ومش جوّه accessibility.spec.ts: الفحص هناك بيشتغل بـ axe، و axe
 * بيقرأ الـ markup الموجود في الصفحة. حبس التركيز (focus trap) **سلوك** مش markup،
 * فـ axe بينجح على dialog مكسور تمامًا من غير ما يشتكي. ده مش عيب في axe — ده حدّه.
 *
 * القياس الفعلي قبل الإصلاح كان:
 *   • التركيز بيفضل على الزرار اللي فتح الـ dialog، مش جوّاه
 *   • بعد 15 ضغطة Tab التركيز بيهرب لعناصر ورا الـ overlay (زراير الثيم واللغة
 *     وروابط التنقّل) — يعني اليوزر بيتنقّل في حاجة متغطّية
 *   • Escape مبيعملش حاجة
 *
 * الاختبارات دي بتقيس نفس التلات حاجات، فلو حد شال الـ DialogDirective أو نسيها
 * في dialog جديد، الفحص بيرجع أحمر بدل ما العيب يعدّي.
 */

const TAB_ATTEMPTS = 25;

function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@example.com`;
}

async function registerAndLogIn(page: Page): Promise<void> {
  await page.goto('/register');
  await page.locator('input[formcontrolname="name"]').fill('Dialog Probe');
  await page.locator('input[formcontrolname="email"]').fill(uniqueEmail('dialog'));
  await page.locator('input[formcontrolname="password"]').fill('Password123');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/');
}

/** بيرجّع وصف مختصر للعنصر المتركّز حاليًا، ولو كان جوّه الـ dialog بيرجّع null. */
async function focusOutsideOf(page: Page, dialog: string): Promise<string | null> {
  return page.evaluate((sel) => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return 'BODY';
    return el.closest(sel) ? null : `${el.tagName}.${el.className || '(no class)'}`.slice(0, 60);
  }, dialog);
}

/**
 * الفحص المشترك لأي dialog: بيتأكد إنه معرّف صح لقارئ الشاشة، وإن التركيز بيدخل
 * جوّاه ومبيخرجش منه، وإن Escape بيقفله ويرجّع التركيز لمكانه.
 */
async function expectAccessibleDialog(page: Page, dialog: string): Promise<void> {
  const el = page.locator(dialog);
  await expect(el).toBeVisible();

  // قارئ الشاشة لازم يعرف إن ده dialog، وإن اللي وراه متعطّل، وإن ليه اسم منطوق.
  await expect(el).toHaveAttribute('role', 'dialog');
  await expect(el).toHaveAttribute('aria-modal', 'true');
  const labelledBy = await el.getAttribute('aria-labelledby');
  expect(labelledBy, `${dialog} لازم يكون مربوط بعنوان عشان يتنطق باسمه`).toBeTruthy();
  await expect(
    page.locator(`#${labelledBy}`),
    `aria-labelledby="${labelledBy}" بيشاور على عنصر مش موجود`
  ).toHaveCount(1);

  // أول ما يتفتح، التركيز لازم يبقى جوّه — مش سايب على الزرار اللي فتحه.
  expect(
    await focusOutsideOf(page, dialog),
    'التركيز فضل بره الـ dialog بعد ما اتفتح'
  ).toBeNull();

  // ومهما اتضغط Tab، مايخرجش.
  const escaped: string[] = [];
  for (let i = 0; i < TAB_ATTEMPTS; i++) {
    await page.keyboard.press('Tab');
    const outside = await focusOutsideOf(page, dialog);
    if (outside) escaped.push(`ضغطة ${i + 1}: ${outside}`);
  }
  expect(
    escaped,
    `التركيز هرب من الـ dialog لعناصر ورا الـ overlay:\n  ${escaped.slice(0, 5).join('\n  ')}`
  ).toEqual([]);
}

test.describe('إتاحة الـ dialogs بالكيبورد', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogIn(page);
  });

  test('نموذج الاشتراك: بيحبس التركيز وبيقفل بـ Escape ويرجّع التركيز لمكانه', async ({ page }) => {
    const trigger = page.locator('.toolbar .btn-primary');
    await trigger.click();

    await expectAccessibleDialog(page, '.modal-content');

    await page.keyboard.press('Escape');
    await expect(page.locator('.modal-content')).toBeHidden();

    // رجوع التركيز مهم بنفس القدر: من غيره اليوزر بيرجع لأول الصفحة كل مرة
    // ويضطر يـ Tab من الأول عشان يوصل للمكان اللي كان فيه.
    await expect(trigger).toBeFocused();
  });

  test('نموذج الميزانية: بيحبس التركيز وبيقفل بـ Escape', async ({ page }) => {
    await page.locator('.budget-set-link, .budget-edit-link').first().click();

    await expectAccessibleDialog(page, '.budget-modal');

    await page.keyboard.press('Escape');
    await expect(page.locator('.budget-modal')).toBeHidden();
  });

  test('إدارة التصنيفات: بتحبس التركيز وبتقفل بـ Escape', async ({ page }) => {
    // `.pill-manage` تحديدًا: فيه كمان pill فلتر اسمه "كل التصنيفات" بيتطابق مع نفس النص
    await page.locator('.pill-manage').filter({ hasText: /التصنيفات|categories/i }).click();

    await expectAccessibleDialog(page, 'app-category-manager .modal-content');

    await page.keyboard.press('Escape');
    await expect(page.locator('app-category-manager .modal-content')).toBeHidden();
  });

  test('إدارة الوسوم: بتحبس التركيز وبتقفل بـ Escape', async ({ page }) => {
    await page.locator('.pill-manage').filter({ hasText: /الوسوم|tags/i }).click();

    await expectAccessibleDialog(page, 'app-tag-manager .modal-content');

    await page.keyboard.press('Escape');
    await expect(page.locator('app-tag-manager .modal-content')).toBeHidden();
  });
});
