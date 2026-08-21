// التصنيفات الستة الافتراضية بتيجي من الباك اند (Seed Data في الـ Migration) بالعربي بس -
// مفيش عمود "NameKey" في الـ DB يميّزها عن تصنيف مخصّص عمله المستخدم بنفسه. فبنطابق بالاسم
// نفسه: لو الاسم مطابق لواحد من الستة دول، نترجمه؛ غير كده (تصنيف مخصّص) نسيبه زي ما هو،
// لأنه أصلاً نص حر من المستخدم مفيش له ترجمة.
const DEFAULT_CATEGORY_NAME_KEYS: Record<string, string> = {
  'ترفيه': 'categories.defaults.entertainment',
  'رياضة وصحة': 'categories.defaults.healthFitness',
  'عمل وإنتاجية': 'categories.defaults.workProductivity',
  'تعليم': 'categories.defaults.education',
  'خدمات سحابية': 'categories.defaults.cloudServices',
  'أخرى': 'categories.defaults.other'
};

export function defaultCategoryNameKey(name: string): string | null {
  return DEFAULT_CATEGORY_NAME_KEYS[name] ?? null;
}
