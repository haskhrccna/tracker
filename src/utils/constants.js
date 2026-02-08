export const SURAHS = [
  "الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس",
  "هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه",
  "الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم",
  "لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر",
  "فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق",
  "الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة",
  "الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج",
  "نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس",
  "التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد",
  "الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات",
  "القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر",
  "المسد","الإخلاص","الفلق","الناس"
];

// Surah number to name mapping (for Quran.com API)
export const SURAH_NUMBERS = {};
SURAHS.forEach((name, i) => { SURAH_NUMBERS[name] = i + 1; });

export const GRADE_THRESHOLDS = [
  { min: 95, label: "ممتاز",       labelEn: "Excellent",         labelFr: "Excellent",    color: "#10b981", emoji: "🌟" },
  { min: 85, label: "جيد جداً",    labelEn: "Very Good",         labelFr: "Très Bien",    color: "#3b82f6", emoji: "✨" },
  { min: 75, label: "جيد",         labelEn: "Good",              labelFr: "Bien",         color: "#8b5cf6", emoji: "👍" },
  { min: 60, label: "مقبول",       labelEn: "Acceptable",        labelFr: "Acceptable",   color: "#f59e0b", emoji: "📖" },
  { min: 0,  label: "يحتاج تحسين", labelEn: "Needs Improvement", labelFr: "À Améliorer",  color: "#ef4444", emoji: "📝" },
];

export function getGrade(score) {
  return GRADE_THRESHOLDS.find(g => score >= g.min) || GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
}

// localStorage keys
export const STORAGE_KEY = "quran-tracker-users";
export const THEME_KEY = "quran-tracker-theme";
export const LANG_KEY = "quran-tracker-lang";
