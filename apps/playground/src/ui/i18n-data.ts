/**
 * SheetX 第 30 张 · 国际化与多语言配置 — 数据
 *
 * 核心立场：SheetX 自带 i18n 能力（语言包 / 格式本地化 / RTL 布局），
 * 不依赖宿主系统的 UI 框架 —— 宿主只需提供 locale 配置。
 */

/** 界面文案键 */
export interface Msg {
  file: string; home: string; insert: string; data: string; formula: string; view: string; settings: string
  search: string; reportTitle: string; colProduct: string; colQty: string; colAmount: string
  total: string; trend: string; pie: string; langSetting: string; formatSetting: string
  translate: string; rtlSupport: string; langSelect: string; langHint: string
  regionFormat: string; dateFormat: string; timeFormat: string; numberFormat: string; currencyFormat: string
  rtl: string; rtlHint: string; tip: string; preview: string
}

/** 8 种语言包（SheetX 内置，不依赖宿主框架） */
export interface Lang {
  code: string
  label: string
  flag: string
  native: string
  dir: 'ltr' | 'rtl'
  msg: Msg
}

const zh: Msg = {
  file: '文件', home: '开始', insert: '插入', data: '数据', formula: '公式', view: '视图', settings: '设置',
  search: '搜索功能...', reportTitle: '销售数据报表', colProduct: '产品名称', colQty: '销售数量', colAmount: '销售金额（元）',
  total: '合计', trend: '销售趋势分析', pie: '产品销售占比', langSetting: '语言设置', formatSetting: '格式设置',
  translate: '文本翻译', rtlSupport: 'RTL 支持', langSelect: '语言选择', langHint: '切换应用界面语言，支持多语言环境',
  regionFormat: '区域格式', dateFormat: '日期格式', timeFormat: '时间格式', numberFormat: '数字格式', currencyFormat: '货币格式',
  rtl: '从右向左布局（RTL）', rtlHint: '支持阿拉伯语、希伯来语等 RTL 语言', tip: 'SheetX 提供完整的国际化方案，让您的应用支持全球用户。', preview: '本地化预览',
}
const en: Msg = {
  file: 'File', home: 'Home', insert: 'Insert', data: 'Data', formula: 'Formula', view: 'View', settings: 'Settings',
  search: 'Search features...', reportTitle: 'Sales Data Report', colProduct: 'Product', colQty: 'Quantity', colAmount: 'Amount (CNY)',
  total: 'Total', trend: 'Sales Trend', pie: 'Product Share', langSetting: 'Language', formatSetting: 'Formats',
  translate: 'Translation', rtlSupport: 'RTL Support', langSelect: 'Language', langHint: 'Switch UI language, multi-language ready',
  regionFormat: 'Regional Formats', dateFormat: 'Date format', timeFormat: 'Time format', numberFormat: 'Number format', currencyFormat: 'Currency format',
  rtl: 'Right-to-Left Layout (RTL)', rtlHint: 'Supports Arabic, Hebrew and other RTL languages', tip: 'SheetX provides complete i18n so your app reaches global users.', preview: 'Locale Preview',
}
const ja: Msg = {
  file: 'ファイル', home: 'ホーム', insert: '挿入', data: 'データ', formula: '数式', view: '表示', settings: '設定',
  search: '機能を検索...', reportTitle: '販売データレポート', colProduct: '製品名', colQty: '販売数量', colAmount: '販売金額（元）',
  total: '合計', trend: '販売傾向分析', pie: '製品別構成比', langSetting: '言語設定', formatSetting: '書式設定',
  translate: 'テキスト翻訳', rtlSupport: 'RTL 対応', langSelect: '言語選択', langHint: 'アプリの表示言語を切り替えます',
  regionFormat: '地域書式', dateFormat: '日付形式', timeFormat: '時刻形式', numberFormat: '数値形式', currencyFormat: '通貨形式',
  rtl: '右から左へ（RTL）', rtlHint: 'アラビア語などの RTL 言語をサポート', tip: 'SheetX は完全な国際化を提供し、世界中のユーザーを支援します。', preview: 'ロケールプレビュー',
}
const de: Msg = {
  file: 'Datei', home: 'Start', insert: 'Einfügen', data: 'Daten', formula: 'Formel', view: 'Ansicht', settings: 'Einstellungen',
  search: 'Funktionen suchen...', reportTitle: 'Verkaufsbericht', colProduct: 'Produkt', colQty: 'Menge', colAmount: 'Betrag (CNY)',
  total: 'Gesamt', trend: 'Verkaufstrend', pie: 'Produktanteil', langSetting: 'Sprache', formatSetting: 'Formate',
  translate: 'Übersetzung', rtlSupport: 'RTL-Unterstützung', langSelect: 'Sprache', langHint: 'UI-Sprache wechseln, mehrsprachig',
  regionFormat: 'Regionale Formate', dateFormat: 'Datumsformat', timeFormat: 'Zeitformat', numberFormat: 'Zahlenformat', currencyFormat: 'Währungsformat',
  rtl: 'Rechts-nach-Links (RTL)', rtlHint: 'Unterstützt Arabisch, Hebräisch und andere RTL-Sprachen', tip: 'SheetX bietet vollständige Internationalisierung für globale Nutzer.', preview: 'Gebietsschema-Vorschau',
}
const fr: Msg = {
  file: 'Fichier', home: 'Début', insert: 'Insertion', data: 'Données', formula: 'Formule', view: 'Affichage', settings: 'Paramètres',
  search: 'Rechercher...', reportTitle: 'Rapport de ventes', colProduct: 'Produit', colQty: 'Quantité', colAmount: 'Montant (CNY)',
  total: 'Total', trend: 'Tendance des ventes', pie: 'Répartition', langSetting: 'Langue', formatSetting: 'Formats',
  translate: 'Traduction', rtlSupport: 'Prise en charge RTL', langSelect: 'Langue', langHint: "Changer la langue de l'interface",
  regionFormat: 'Formats régionaux', dateFormat: 'Format de date', timeFormat: "Format d'heure", numberFormat: 'Format de nombre', currencyFormat: 'Format de devise',
  rtl: 'De droite à gauche (RTL)', rtlHint: "Prend en charge l'arabe, l'hébreu et les langues RTL", tip: 'SheetX offre une internationalisation complète pour vos utilisateurs.', preview: 'Aperçu des paramètres régionaux',
}
const es: Msg = {
  file: 'Archivo', home: 'Inicio', insert: 'Insertar', data: 'Datos', formula: 'Fórmula', view: 'Vista', settings: 'Ajustes',
  search: 'Buscar funciones...', reportTitle: 'Informe de ventas', colProduct: 'Producto', colQty: 'Cantidad', colAmount: 'Importe (CNY)',
  total: 'Total', trend: 'Tendencia de ventas', pie: 'Cuota de producto', langSetting: 'Idioma', formatSetting: 'Formatos',
  translate: 'Traducción', rtlSupport: 'Soporte RTL', langSelect: 'Idioma', langHint: 'Cambiar idioma de la interfaz',
  regionFormat: 'Formatos regionales', dateFormat: 'Formato de fecha', timeFormat: 'Formato de hora', numberFormat: 'Formato de número', currencyFormat: 'Formato de moneda',
  rtl: 'De derecha a izquierda (RTL)', rtlHint: 'Compatible con árabe, hebreo y otros idiomas RTL', tip: 'SheetX ofrece internacionalización completa para usuarios de todo el mundo.', preview: 'Vista previa de configuración regional',
}
const ko: Msg = {
  file: '파일', home: '홈', insert: '삽입', data: '데이터', formula: '수식', view: '보기', settings: '설정',
  search: '기능 검색...', reportTitle: '판매 데이터 보고서', colProduct: '제품명', colQty: '판매 수량', colAmount: '판매 금액 (위안)',
  total: '합계', trend: '판매 추이 분석', pie: '제품별 비중', langSetting: '언어 설정', formatSetting: '형식 설정',
  translate: '텍스트 번역', rtlSupport: 'RTL 지원', langSelect: '언어 선택', langHint: '앱 인터페이스 언어를 전환합니다',
  regionFormat: '지역 형식', dateFormat: '날짜 형식', timeFormat: '시간 형식', numberFormat: '숫자 형식', currencyFormat: '통화 형식',
  rtl: '오른쪽에서 왼쪽 (RTL)', rtlHint: '아랍어, 히브리어 등 RTL 언어 지원', tip: 'SheetX는 완전한 국제화 기능으로 전 세계 사용자를 지원합니다.', preview: '로케일 미리보기',
}
const ar: Msg = {
  file: 'ملف', home: 'الرئيسية', insert: 'إدراج', data: 'البيانات', formula: 'صيغة', view: 'عرض', settings: 'إعدادات',
  search: 'البحث عن الميزات...', reportTitle: 'تقرير بيانات المبيعات', colProduct: 'المنتج', colQty: 'الكمية', colAmount: 'المبلغ (يوان)',
  total: 'الإجمالي', trend: 'اتجاه المبيعات', pie: 'حصة المنتج', langSetting: 'اللغة', formatSetting: 'التنسيقات',
  translate: 'الترجمة', rtlSupport: 'دعم RTL', langSelect: 'اللغة', langHint: 'تبديل لغة الواجهة، دعم متعدد اللغات',
  regionFormat: 'التنسيقات الإقليمية', dateFormat: 'تنسيق التاريخ', timeFormat: 'تنسيق الوقت', numberFormat: 'تنسيق الرقم', currencyFormat: 'تنسيق العملة',
  rtl: 'من اليمين إلى اليسار (RTL)', rtlHint: 'يدعم العربية والعبرية وغيرها من لغات RTL', tip: 'يوفر SheetX internationalization كاملة لدعم المستخدمين حول العالم.', preview: 'معاينة الإعدادات المحلية',
}

export const LANGS: Lang[] = [
  { code: 'zh-CN', label: '简体中文', flag: '🇨🇳', native: 'Chinese (Simplified)', dir: 'ltr', msg: zh },
  { code: 'en-US', label: 'English', flag: '🇺🇸', native: 'English', dir: 'ltr', msg: en },
  { code: 'ja-JP', label: '日本語', flag: '🇯🇵', native: 'Japanese', dir: 'ltr', msg: ja },
  { code: 'de-DE', label: 'Deutsch', flag: '🇩🇪', native: 'German', dir: 'ltr', msg: de },
  { code: 'fr-FR', label: 'Français', flag: '🇫🇷', native: 'French', dir: 'ltr', msg: fr },
  { code: 'es-ES', label: 'Español', flag: '🇪🇸', native: 'Spanish', dir: 'ltr', msg: es },
  { code: 'ko-KR', label: '한국어', flag: '🇰🇷', native: 'Korean', dir: 'ltr', msg: ko },
  { code: 'ar-SA', label: 'العربية', flag: '🇸🇦', native: 'Arabic (RTL)', dir: 'rtl', msg: ar },
]

/** 区域格式选项 */
export const DATE_FORMATS = ['2025-01-01', '01/01/2025', '2025年1月1日', '01.01.2025']
export const TIME_FORMATS = ['14:30:00', '02:30:00 PM', '14:30', '14時30分']
export const NUMBER_FORMATS = ['1,234.56', '1234.56', '1.234,56', '1 234,56']
export const CURRENCY_FORMATS = ['¥1,234.56', '$1,234.56', '€1.234,56', '£1,234.56']

/** 右侧四个标签 */
export const RIGHT_TABS = ['语言设置', '格式设置', '文本翻译', 'RTL 支持'] as const
export type RightTab = (typeof RIGHT_TABS)[number]

/** 本地化预览（底部 5 卡片，语言固定；格式随配置变） */
export interface PreviewCard { code: string; flag: string; label: string; date: string; time: string; number: string; currency: string }
export const PREVIEW_CARDS: PreviewCard[] = [
  { code: 'zh-CN', flag: '🇨🇳', label: '中文（简体）', date: '2025年1月1日', time: '14:30:00', number: '1,234.56', currency: '¥ 1,234.56' },
  { code: 'en-US', flag: '🇺🇸', label: 'English', date: 'Jan 1, 2025', time: '2:30:00 PM', number: '1,234.56', currency: '$ 1,234.56' },
  { code: 'ja-JP', flag: '🇯🇵', label: '日本語', date: '2025年1月1日', time: '14時30分', number: '1,234.56', currency: '¥ 1,234.56' },
  { code: 'de-DE', flag: '🇩🇪', label: 'Deutsch', date: '01.01.2025', time: '14:30:00', number: '1.234,56', currency: '1.234,56 €' },
  { code: 'fr-FR', flag: '🇫🇷', label: 'Français', date: '01/01/2025', time: '14:30:00', number: '1 234,56', currency: '1 234,56 €' },
]

/** 翻译词条（文本翻译 tab） */
export interface Term { key: string; source: string; translated: string }
export const INITIAL_TERMS: Term[] = [
  { key: 'save', source: 'Save', translated: '保存' },
  { key: 'cancel', source: 'Cancel', translated: '取消' },
  { key: 'submit', source: 'Submit', translated: '提交' },
  { key: 'validation', source: 'Validation failed', translated: '校验失败' },
  { key: 'empty', source: 'No data', translated: '暂无数据' },
]

/** i18n 契约 */
export const I18N_CONTRACT = `// SheetX 自带 i18n —— 不依赖宿主 UI 框架
const sheet = SheetX.createGrid({
  container: '#grid',
  i18n: {
    locale: 'zh-CN',          // 语言包由 SheetX 内置
    fallback: 'en-US',        // 缺失词条回退
    formats: {
      date: 'YYYY-MM-DD',
      time: 'HH:mm:ss',
      number: '1,234.56',
      currency: '¥#,##0.00',
    },
    dir: 'ltr',               // ltr | rtl（自动布局镜像）
  },
})

// 运行时切换语言，无需重建实例
sheet.setLocale('ar-SA')      // UI 文案 + 格式 + RTL 一并切换

// 自定义/覆盖词条（业务术语）
sheet.registerTranslations('zh-CN', { save: '保存更改' })

// 格式化 API（业务代码可直接用）
sheet.i18n.formatDate(new Date())   // '2025-01-01'
sheet.i18n.formatCurrency(1234.56)  // '¥1,234.56'`

export interface FullConfig {
  lang: string
  dateFormat: string
  timeFormat: string
  numberFormat: string
  currencyFormat: string
  rtl: boolean
  terms: Term[]
}

export const DEFAULT_CONFIG: FullConfig = {
  lang: 'zh-CN',
  dateFormat: DATE_FORMATS[0]!,
  timeFormat: TIME_FORMATS[0]!,
  numberFormat: NUMBER_FORMATS[0]!,
  currencyFormat: CURRENCY_FORMATS[0]!,
  rtl: false,
  terms: INITIAL_TERMS.map((t) => ({ ...t })),
}
