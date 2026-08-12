// بنستخدم خدمة Google العامة لجلب أيقونة أي موقع بمجرد ما نعرف الدومين بتاعه
// ده بديل عملي وسريع لرفع اللوجو يدويًا (مش محتاج تخزين ملفات ولا Backend إضافي)
export function getLogoUrl(websiteUrl: string | null, size = 64): string | null {
  if (!websiteUrl) return null;

  try {
    const url = new URL(websiteUrl);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=${size}`;
  } catch {
    // لو الرابط مش صالح (مثلاً المستخدم كتب نص عادي بدل URL)، منرجعش لوجو
    return null;
  }
}
