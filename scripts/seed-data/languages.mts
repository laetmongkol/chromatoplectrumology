// Languages known to the system. `enabled` is only true where a translation set exists.
// Others are listed so an admin can fill them in and switch them on.
// slug = URL prefix (/th, /jp ...), flag = ISO 3166 country code for the flag icon.
export const LANGUAGES = [
  { code: "th", slug: "th", flag: "th", nativeName: "ไทย", englishName: "Thai", enabled: true, isDefault: true },
  { code: "en", slug: "en", flag: "gb", nativeName: "English", englishName: "English", enabled: true },
  { code: "ja", slug: "jp", flag: "jp", nativeName: "日本語", englishName: "Japanese", enabled: true },
  { code: "zh-CN", slug: "zh", flag: "cn", nativeName: "简体中文", englishName: "Chinese (Simplified)", enabled: true },
  { code: "ru", slug: "ru", flag: "ru", nativeName: "Русский", englishName: "Russian", enabled: true },
  { code: "lo", slug: "lo", flag: "la", nativeName: "ລາວ", englishName: "Lao", enabled: true },
  { code: "ko", slug: "ko", flag: "kr", nativeName: "한국어", englishName: "Korean", enabled: true },
  { code: "vi", slug: "vi", flag: "vn", nativeName: "Tiếng Việt", englishName: "Vietnamese", enabled: true },
  { code: "zh-TW", slug: "tw", flag: "tw", nativeName: "繁體中文", englishName: "Chinese (Traditional)", enabled: false },
  { code: "id", slug: "id", flag: "id", nativeName: "Bahasa Indonesia", englishName: "Indonesian", enabled: false },
  { code: "ms", slug: "ms", flag: "my", nativeName: "Bahasa Melayu", englishName: "Malay", enabled: false },
  { code: "km", slug: "km", flag: "kh", nativeName: "ខ្មែរ", englishName: "Khmer", enabled: false },
  { code: "my", slug: "mm", flag: "mm", nativeName: "မြန်မာ", englishName: "Burmese", enabled: false },
  { code: "fil", slug: "fil", flag: "ph", nativeName: "Filipino", englishName: "Filipino", enabled: false },
  { code: "hi", slug: "hi", flag: "in", nativeName: "हिन्दी", englishName: "Hindi", enabled: false },
  { code: "es", slug: "es", flag: "es", nativeName: "Español", englishName: "Spanish", enabled: false },
  { code: "fr", slug: "fr", flag: "fr", nativeName: "Français", englishName: "French", enabled: false },
  { code: "de", slug: "de", flag: "de", nativeName: "Deutsch", englishName: "German", enabled: false },
  { code: "pt", slug: "pt", flag: "pt", nativeName: "Português", englishName: "Portuguese", enabled: false },
  { code: "it", slug: "it", flag: "it", nativeName: "Italiano", englishName: "Italian", enabled: false },
  { code: "tr", slug: "tr", flag: "tr", nativeName: "Türkçe", englishName: "Turkish", enabled: false },
  { code: "ar", slug: "ar", flag: "sa", nativeName: "العربية", englishName: "Arabic", rtl: true, enabled: false },
];
