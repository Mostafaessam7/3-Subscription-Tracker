import { randomUUID } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

/**
 * فحص إتاحة (accessibility) تلقائي على الصفحات الحقيقية.
 *
 * ليه ده موجود: مراجعة المشروع لقت إن الفرع الرئيسي كان فيه **صفر** خاصية `aria-`
 * خالص — الشغل اللي بيضيفها كان متعمل ومتسّاب على فرع من غير ما يتدمج. يعني الإتاحة
 * هنا مكانتش بتتقاس أصلاً، والحاجة اللي مش بتتقاس بترجع تتكسر.
 *
 * الفحص بيشتغل على DOM حقيقي بعد ما الصفحة تشتغل فعلاً، مش على markup ثابت، فبيمسك
 * الحاجات اللي بتظهر وقت التشغيل بس: تباين ألوان محسوب، حقول من غير label مربوط،
 * وترتيب عناوين متكسّر.
 *
 * القواعد متحصورة عمدًا في wcag2a/wcag2aa: دي المعايير اللي المنتج بيلتزم بيها،
 * وتشغيل كل قواعد axe (فيها best-practice وتجريبية) بيدّي ضجيج بيخلي الفحص كله
 * يتتجاهل بعد أسبوع.
 */

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@example.com`;
}

/** بيسجّل مستخدم جديد ويسيب المتصفح داخل الداشبورد. */
async function registerAndLogIn(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/register');
  await page.locator('input[formcontrolname="name"]').fill('A11y Probe');
  await page.locator('input[formcontrolname="email"]').fill(uniqueEmail('a11y'));
  await page.locator('input[formcontrolname="password"]').fill('Password123');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/');
}

/** بيرجّع المخالفات بشكل مقروء بدل رقم مجرد — رسالة الفشل لازم تقول تصلّح إيه وفين. */
function describe(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']): string {
  return violations
    .map((v) => {
      const where = v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n      ');
      return `  [${v.impact}] ${v.id}: ${v.help}\n    ${v.helpUrl}\n    العناصر:\n      ${where}`;
    })
    .join('\n\n');
}

test.describe('الإتاحة (WCAG 2.1 AA)', () => {
  test('صفحة تسجيل الدخول مفيهاش مخالفات', async ({ page }) => {
    await page.goto('/login');

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();

    expect(violations.length, `مخالفات إتاحة في /login:\n\n${describe(violations)}`).toBe(0);
  });

  test('صفحة إنشاء الحساب مفيهاش مخالفات', async ({ page }) => {
    await page.goto('/register');

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();

    expect(violations.length, `مخالفات إتاحة في /register:\n\n${describe(violations)}`).toBe(0);
  });

  test('الداشبورد بعد تسجيل الدخول مفيهاش مخالفات', async ({ page }) => {
    // الداشبورد هي الصفحة اللي فيها معظم أزرار الأيقونات اللي الـ aria-label اتضاف
    // ليها — يعني هي بالظبط الصفحة اللي رجوع الشغل ده هيتكسر فيها في صمت.
    await registerAndLogIn(page);

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();

    expect(violations.length, `مخالفات إتاحة في الداشبورد:\n\n${describe(violations)}`).toBe(0);
  });

  test('الوضع الفاتح مفيهوش مخالفات تباين', async ({ page }) => {
    // التباين بيتحسب من الألوان اللي اترسمت فعلاً، والوضعين ليهم لوحات مختلفة —
    // فحص وضع واحد بس بيسيب نص الاحتمالات من غير تغطية.
    await registerAndLogIn(page);

    await page.evaluate(() => {
      localStorage.setItem('subscription_tracker_theme', 'light');
    });
    // إعادة تحميل مقصودة: تبديل الثيم على صفحة مرسومة بالفعل بيسيب قيم قديمة
    // في الرسم، فبتطلع مخالفات تباين مش حقيقية.
    await page.reload();

    const { violations } = await new AxeBuilder({ page })
      .withTags(WCAG)
      .analyze();

    expect(violations.length, `مخالفات إتاحة في الوضع الفاتح:\n\n${describe(violations)}`).toBe(0);
  });
});
