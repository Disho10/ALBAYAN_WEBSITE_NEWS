export type Lang = "ar" | "en";

const t = {
  // Header
  siteName: { ar: "البيان الإخباري", en: "AlBayan News" },
  siteTagline: { ar: "من قلب الحدث", en: "From the heart of the action" },
  live: { ar: "مباشر", en: "LIVE" },
  coverageLebanon: { ar: "تغطية لبنان", en: "Lebanon Coverage" },
  sirensIn: { ar: "صافرات في", en: "Sirens in" },
  areas: { ar: "مناطق", en: "areas" },
  lightMode: { ar: "الوضع الفاتح", en: "Light mode" },
  darkMode: { ar: "الوضع الداكن", en: "Dark mode" },
  telegram: { ar: "تلغرام", en: "Telegram" },
  supportUs: { ar: "ادعمنا", en: "Support" },
  report: { ar: "بلّغ", en: "Report" },
  whatsapp: { ar: "واتساب", en: "WhatsApp" },
  settings: { ar: "الإعدادات", en: "Settings" },
  backToMap: { ar: "العودة للخريطة", en: "Back to map" },

  // Search
  searchPlaceholder: { ar: "ابحث عن منطقة...", en: "Search area..." },
  noResults: { ar: "لا توجد نتائج", en: "No results" },

  // Map controls
  zoomIn: { ar: "تكبير", en: "Zoom in" },
  zoomOut: { ar: "تصغير", en: "Zoom out" },
  myLocation: { ar: "موقعي", en: "My location" },
  filter: { ar: "تصفية", en: "Filter" },
  layers: { ar: "الطبقات", en: "Layers" },
  mapLegend: { ar: "مفتاح الخريطة", en: "Map Legend" },
  events: { ar: "الأحداث", en: "Events" },
  liveEvents: { ar: "الأحداث المباشرة", en: "Live Events" },
  noEvents: { ar: "لا توجد أحداث حالياً", en: "No active events" },
  expiresIn: { ar: "ينتهي بعد:", en: "Expires in:" },
  remainingTime: { ar: "المدة المتبقية", en: "Remaining" },
  loading: { ar: "جاري التحميل...", en: "Loading..." },
  loadError: { ar: "تعذر تحميل التنبيهات", en: "Failed to load alerts" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  urgent: { ar: "عاجل", en: "URGENT" },
  permanent: { ar: "دائم", en: "Permanent" },
  expired: { ar: "انتهى", en: "Expired" },
  now: { ar: "الآن", en: "now" },
  liveMap: { ar: "الخريطة المباشرة", en: "Live Map" },
  share: { ar: "مشاركة", en: "Share" },
  copied: { ar: "تم النسخ", en: "Copied!" },
  reconnecting: { ar: "جاري إعادة الاتصال...", en: "Reconnecting..." },

  // Filters
  all: { ar: "الكل", en: "All" },
  strikes: { ar: "غارات", en: "Strikes" },
  drones: { ar: "مسيّرات", en: "Drones" },
  threats: { ar: "تهديدات", en: "Threats" },
  enemyPos: { ar: "تمركز العدو", en: "Enemy pos." },
  army: { ar: "الجيش", en: "Army" },
  sirens: { ar: "صافرات", en: "Sirens" },
  accidents: { ar: "حوادث", en: "Accidents" },
  clashes: { ar: "اشتباكات", en: "Clashes" },

  // Time filters
  lastHour: { ar: "ساعة", en: "1h" },
  last6Hours: { ar: "6 ساعات", en: "6h" },
  last24Hours: { ar: "24 ساعة", en: "24h" },

  // Layers
  defaultMap: { ar: "الخريطة", en: "Map" },
  satellite: { ar: "قمر صناعي", en: "Satellite" },
  heatmap: { ar: "خريطة حرارية", en: "Heatmap" },

  // Legend
  strikeArtillery: { ar: "غارة / قصف", en: "Strike / Shelling" },
  threat: { ar: "تهديد", en: "Threat" },
  enemyPosition: { ar: "تمركز العدو", en: "Enemy position" },
  lebArmy: { ar: "الجيش اللبناني", en: "Lebanese Army" },
  droneActivity: { ar: "مسيّرات", en: "Drones" },
  sirenAlert: { ar: "صافرات إنذار", en: "Siren alert" },

  // Settings
  settingsTitle: { ar: "إعدادات الخريطة", en: "Map Settings" },
  preferences: { ar: "تفضيلات المستخدم", en: "User Preferences" },
  customizeMap: { ar: "تخصيص تجربة الخريطة", en: "Customize Map Experience" },
  preferredArea: { ar: "المنطقة المفضلة", en: "Preferred Area" },
  alertTypes: { ar: "أنواع التنبيهات", en: "Alert Types" },
  displayOptions: { ar: "خيارات العرض", en: "Display Options" },
  urgentBarToggle: { ar: "إظهار شريط الأخبار العاجلة", en: "Show urgent alert bar" },
  urgentBarDesc: { ar: "عرض التنبيه العاجل أعلى الخريطة عند وجود حدث مهم.", en: "Display urgent alert banner at top of map." },
  highlightToggle: { ar: "إبراز المناطق المهددة", en: "Highlight threatened areas" },
  highlightDesc: { ar: "تلوين المنطقة بالكامل عند وجود تهديد أو تمركز.", en: "Color the entire region when there is a threat." },
  soundToggle: { ar: "تشغيل صوت عند التنبيه", en: "Alert sound" },
  soundDesc: { ar: "تنبيه صوتي عند وصول حدث عاجل جديد.", en: "Play a sound when a new urgent alert arrives." },
  soundType: { ar: "نوع الصوت", en: "Sound Type" },
  soundAlarm: { ar: "إنذار", en: "Alarm" },
  soundBeep: { ar: "تنبيه", en: "Beep" },
  soundChime: { ar: "رنين", en: "Chime" },
  saveSettings: { ar: "حفظ الإعدادات", en: "Save Settings" },
  saved: { ar: "✓ تم الحفظ", en: "✓ Saved" },
  systemStatus: { ar: "حالة النظام", en: "System Status" },
  systemOnline: { ar: "النظام يعمل", en: "System Online" },
  quickLinks: { ar: "روابط سريعة", en: "Quick Links" },
  faq: { ar: "الأسئلة الشائعة", en: "FAQ" },
  privacy: { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  terms: { ar: "الشروط والأحكام", en: "Terms & Conditions" },
  notifications: { ar: "الإشعارات", en: "Notifications" },
  enableNotifications: { ar: "تفعيل الإشعارات", en: "Enable Notifications" },
  notifDesc: { ar: "استلم إشعارات فورية عند وصول تنبيه عاجل.", en: "Get instant push notifications for urgent alerts." },
  notifEnabled: { ar: "الإشعارات مفعلة", en: "Notifications enabled" },
  notifBlocked: { ar: "الإشعارات محظورة في المتصفح", en: "Notifications blocked by browser" },

  // History
  historyTitle: { ar: "سجل التنبيهات", en: "Alert History" },
  historyDesc: { ar: "تصفح جميع التنبيهات السابقة والمنتهية.", en: "Browse all past and expired alerts." },
  activeAlerts: { ar: "نشطة", en: "Active" },
  expiredAlerts: { ar: "منتهية", en: "Expired" },
  allAlerts: { ar: "الكل", en: "All" },
  noHistory: { ar: "لا توجد تنبيهات سابقة", en: "No past alerts found" },

  // Stats
  statsTitle: { ar: "إحصائيات المنصة", en: "Platform Statistics" },
  statsDesc: { ar: "نظرة عامة على التنبيهات والأحداث.", en: "Overview of alerts and events." },
  totalAlerts: { ar: "إجمالي التنبيهات", en: "Total Alerts" },
  activeNow: { ar: "نشطة الآن", en: "Active Now" },
  urgentNow: { ar: "عاجلة الآن", en: "Urgent Now" },
  last7Days: { ar: "آخر 7 أيام", en: "Last 7 Days" },
  byType: { ar: "حسب النوع", en: "By Type" },
  byArea: { ar: "حسب المنطقة", en: "By Area" },
  alertCount: { ar: "عدد التنبيهات", en: "Alert Count" },

  // About
  aboutTitle: { ar: "عن البيان", en: "About AlBayan" },
  aboutDesc: { ar: "منصة ميدانية مستقلة لعرض التنبيهات والأحداث في لبنان.", en: "An independent field platform for displaying alerts and events in Lebanon." },
  ourMission: { ar: "مهمتنا", en: "Our Mission" },
  becomeCorrespondent: { ar: "كن مراسلاً", en: "Become a Correspondent" },

  // Keyboard shortcuts
  shortcuts: { ar: "اختصارات لوحة المفاتيح", en: "Keyboard Shortcuts" },

  // Footer
  footerCopyright: { ar: "البيان الإخباري", en: "AlBayan News" },

  // Misc
  noDetails: { ar: "لا توجد تفاصيل إضافية.", en: "No additional details." },
  viewOnMap: { ar: "شاهد على الخريطة", en: "View on map" },
} as const;

export type TKey = keyof typeof t;
export function tr(key: TKey, lang: Lang): string { return t[key]?.[lang] ?? t[key]?.ar ?? key; }
export default t;
