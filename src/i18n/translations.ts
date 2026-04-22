/**
 * Hệ thống dịch trung tâm — 4 ngôn ngữ: vi · en · ja · zh
 * Mọi component phải dùng t('key') thay vì hardcode chuỗi.
 */

export type Language = 'vi' | 'en' | 'ja' | 'zh';

export const LANG_LABELS: Record<Language, string> = {
  vi: '🇻🇳 Tiếng Việt',
  en: '🇬🇧 English',
  ja: '🇯🇵 日本語',
  zh: '🇨🇳 中文',
};

type Dict = Record<Language, string>;

export const translations: Record<string, Dict> = {
  // ───────── NAVIGATION ─────────
  'nav.intro':         { vi: 'Giới thiệu',         en: 'About',           ja: '概要',             zh: '关于我们' },
  'nav.about':         { vi: 'Giới thiệu',         en: 'About',           ja: '紹介',             zh: '关于' },
  'nav.overview':      { vi: 'Tổng quan',          en: 'Overview',        ja: '概要',             zh: '概览' },
  'nav.rooms':         { vi: 'Hạng phòng',         en: 'Room Types',      ja: '客室タイプ',       zh: '房型' },
  'nav.rooms_booking': { vi: 'Phòng & Đặt phòng',  en: 'Rooms & Book',    ja: '客室・ご予約',     zh: '客房预订' },
  'nav.booking':       { vi: 'Đặt phòng',          en: 'Booking',         ja: '予約',             zh: '预订' },
  'nav.dining':        { vi: 'Ẩm thực',            en: 'Dining',          ja: 'レストラン',       zh: '餐饮' },
  'nav.services':      { vi: 'Dịch vụ',            en: 'Services',        ja: 'サービス',         zh: '服务' },
  'nav.explore':       { vi: 'Khám phá',           en: 'Explore',         ja: '観光案内',         zh: '探索' },
  'nav.offers':        { vi: 'Khuyến mãi',         en: 'Offers',          ja: '特典・割引',       zh: '优惠' },
  'nav.promotions':    { vi: 'Khuyến mại',         en: 'Promotions',      ja: 'プロモ',           zh: '促销' },
  'nav.gallery':       { vi: 'Thư viện ảnh',       en: 'Gallery',         ja: 'ギャラリー',       zh: '图库' },
  'nav.contact':       { vi: 'Liên hệ',            en: 'Contact',         ja: 'お問合せ',         zh: '联系' },
  'nav.food_order':    { vi: 'Đặt đồ ăn',          en: 'Food Order',      ja: 'フードオーダー',   zh: '点餐' },
  'nav.reviews':       { vi: 'Đánh giá',           en: 'Reviews',         ja: 'レビュー',         zh: '评价' },
  'nav.blog':          { vi: 'Blog',               en: 'Blog',            ja: 'ブログ',           zh: '博客' },
  'nav.seafood':       { vi: 'Hải sản khô',        en: 'Dried Seafood',   ja: '干物',             zh: '海鲜干货' },
  'nav.terms':         { vi: 'Điều khoản',         en: 'Terms',           ja: '規定',             zh: '条款' },
  'nav.book_now':      { vi: 'Đặt ngay',           en: 'Book Now',        ja: '今すぐ予約',       zh: '立即预订' },
  'nav.more':          { vi: 'Thêm',               en: 'More',            ja: 'その他',           zh: '更多' },
  'nav.signin':        { vi: 'Đăng nhập',          en: 'Sign in',         ja: 'ログイン',         zh: '登录' },
  'nav.signup_signin': { vi: 'Đăng nhập / Đăng ký',en: 'Sign in / Sign up',ja: 'ログイン / 登録',  zh: '登录 / 注册' },
  'nav.signout':       { vi: 'Đăng xuất',          en: 'Sign out',        ja: 'ログアウト',       zh: '退出' },
  'nav.admin':         { vi: 'Quản trị',           en: 'Admin',           ja: '管理',             zh: '管理' },

  // ───────── HERO ─────────
  'hero.welcome':      { vi: 'Chào mừng đến với',  en: 'Welcome to',      ja: 'ようこそ',         zh: '欢迎来到' },
  'hero.label':        { vi: 'FLC Sầm Sơn · Thanh Hóa', en: 'FLC Sầm Sơn · Vietnam', ja: 'FLCサムソン・ベトナム', zh: 'FLC沙滩 · 越南' },
  'hero.title':        { vi: 'Tuấn Đạt Luxury',    en: 'Tuấn Đạt Luxury', ja: 'Tuấn Đạt Luxury',  zh: '俊达豪华酒店' },
  'hero.subtitle':     { vi: 'Trải nghiệm nghỉ dưỡng đẳng cấp bên bờ biển Sầm Sơn', en: 'Premium beachside resort experience in Sầm Sơn', ja: 'サムソンビーチのプレミアムリゾート体験', zh: '岑山海滩高级度假体验' },
  'hero.tagline':      { vi: 'Nơi Biển Cả gặp gỡ Sự Sang Trọng', en: 'Where the Sea meets Luxury', ja: '海と格式が出会う場所', zh: '海洋与奢华相遇之地' },
  'hero.book_now':     { vi: 'Đặt phòng ngay',     en: 'Book Now',        ja: '今すぐ予約',       zh: '立即预订' },
  'hero.cta_book':     { vi: 'Đặt phòng ngay',     en: 'Book Now',        ja: '予約する',         zh: '立即预订' },
  'hero.cta_explore':  { vi: 'Khám phá phòng',     en: 'Explore Rooms',   ja: '客室を探す',       zh: '探索房间' },

  // ───────── BOOKING SEARCH ─────────
  'book.checkin':      { vi: 'Nhận phòng',         en: 'Check-in',        ja: 'チェックイン',     zh: '入住' },
  'book.checkout':     { vi: 'Trả phòng',          en: 'Check-out',       ja: 'チェックアウト',   zh: '退房' },
  'search.checkin':    { vi: 'Nhận phòng',         en: 'Check-in',        ja: 'チェックイン',     zh: '入住日期' },
  'search.checkout':   { vi: 'Trả phòng',          en: 'Check-out',       ja: 'チェックアウト',   zh: '退房日期' },
  'booking.summary':   { vi: 'Tóm tắt đặt phòng',  en: 'Booking Summary', ja: '予約概要',         zh: '预订摘要' },
  'booking.total':     { vi: 'Tổng cộng',          en: 'Total',           ja: '合計',             zh: '总计' },
  'booking.full_name': { vi: 'Họ và tên',          en: 'Full Name',       ja: 'お名前',           zh: '姓名' },
  'booking.email':     { vi: 'Email',              en: 'Email',           ja: 'メール',           zh: '邮箱' },
  'booking.phone':     { vi: 'Số điện thoại',      en: 'Phone',           ja: '電話番号',         zh: '电话号码' },
  'book.guests':       { vi: 'Số khách',           en: 'Guests',          ja: '宿泊人数',         zh: '入住人数' },
  'book.adults':       { vi: 'Người lớn',          en: 'Adults',          ja: '大人',             zh: '成人' },
  'book.children':     { vi: 'Trẻ em',             en: 'Children',        ja: 'お子様',           zh: '儿童' },
  'book.search':       { vi: 'Tìm phòng',          en: 'Search Rooms',    ja: '空室を検索',       zh: '搜索客房' },
  'book.discount_web': { vi: 'Giảm 15% khi đặt qua web', en: '15% off online booking', ja: 'Web予約で15%割引', zh: '网上预订享15%折扣' },
  'book.nights':       { vi: 'đêm',                en: 'nights',          ja: '泊',               zh: '晚' },
  'book.processing':   { vi: 'Đang xử lý...',      en: 'Processing...',   ja: '処理中...',        zh: '处理中...' },
  'book.confirm':      { vi: 'Xác nhận đặt phòng', en: 'Confirm Booking', ja: '予約確認',         zh: '确认预订' },
  'book.total':        { vi: 'Tổng cộng',          en: 'Total',           ja: '合計',             zh: '总计' },
  'book.guest_info':   { vi: 'Thông tin khách',    en: 'Guest Information',ja: 'ご宿泊者情報',    zh: '客人信息' },
  'book.full_name':    { vi: 'Họ tên',             en: 'Full Name',       ja: 'お名前',           zh: '姓名' },
  'book.email':        { vi: 'Email',              en: 'Email',           ja: 'メール',           zh: '邮箱' },
  'book.phone':        { vi: 'Số điện thoại',      en: 'Phone',           ja: '電話番号',         zh: '电话' },
  'book.notes':        { vi: 'Ghi chú',            en: 'Notes',           ja: '備考',             zh: '备注' },
  'book.summary':      { vi: 'Tóm tắt đặt phòng',  en: 'Booking Summary', ja: '予約概要',         zh: '预订摘要' },
  'book.rooms_count':  { vi: 'Số phòng',           en: 'Rooms',           ja: '部屋数',           zh: '房间数' },

  // ───────── BOOKING FLOW STEPS ─────────
  'flow.step1':        { vi: 'Chọn phòng',         en: 'Select Room',     ja: '客室選択',         zh: '选择客房' },
  'flow.step2':        { vi: 'Dịch vụ',            en: 'Services',        ja: 'サービス',         zh: '服务' },
  'flow.step3':        { vi: 'Thông tin',          en: 'Your Info',       ja: 'お客様情報',       zh: '个人信息' },
  'flow.step4':        { vi: 'Xác nhận',           en: 'Confirm',         ja: '確認',             zh: '确认' },

  // ───────── ROOMS ─────────
  'room.from_price':   { vi: 'Từ',                 en: 'From',            ja: '料金',             zh: '起价' },
  'room.per_night':    { vi: '/đêm',               en: '/night',          ja: '/泊',              zh: '/晚' },
  'room.sea_view':     { vi: 'View biển',          en: 'Sea View',        ja: '海側',             zh: '海景' },
  'room.city_view':    { vi: 'View thành phố',     en: 'City View',       ja: '市内側',           zh: '城市景观' },
  'room.pool_view':    { vi: 'View hồ bơi',        en: 'Pool View',       ja: 'プール側',         zh: '泳池景观' },
  'room.book_this':    { vi: 'Đặt phòng này',      en: 'Book This Room',  ja: 'この部屋を予約',   zh: '预订此房' },
  'room.book':         { vi: 'Đặt phòng',          en: 'Book Now',        ja: '予約する',         zh: '预订' },
  'room.view_detail':  { vi: 'Xem chi tiết',       en: 'View Details',    ja: '詳細を見る',       zh: '查看详情' },
  'room.available':    { vi: 'phòng còn lại',      en: 'rooms left',      ja: '室残り',           zh: '间剩余' },
  'room.capacity':     { vi: 'Sức chứa',           en: 'Capacity',        ja: '定員',             zh: '容量' },
  'room.size':         { vi: 'Diện tích',          en: 'Size',            ja: '面積',             zh: '面积' },
  'room.amenities':    { vi: 'Tiện nghi',          en: 'Amenities',       ja: 'アメニティ',       zh: '设施' },

  // ───────── DINING ─────────
  'dining.label':      { vi: 'ẨM THỰC',            en: 'DINING',          ja: 'お食事',           zh: '餐饮' },
  'dining.title':      { vi: 'Hương Vị Biển Cả',   en: 'Ocean Flavors',   ja: '海の味わい',       zh: '海洋风味' },
  'dining.menu':       { vi: 'Xem thực đơn',       en: 'View Menu',       ja: 'メニューを見る',   zh: '查看菜单' },
  'dining.reserve':    { vi: 'Đặt bàn ngay',       en: 'Reserve Table',   ja: 'テーブル予約',     zh: '预订餐桌' },
  'dining.fresh':      { vi: 'Hải sản tươi sống',  en: 'Fresh Seafood',   ja: '新鮮な海産物',     zh: '新鲜海鲜' },
  'dining.dishes':     { vi: '120+ món',           en: '120+ dishes',     ja: '120品以上',        zh: '120道以上' },
  'dining.group':      { vi: 'Nhóm 1–20+ người',   en: 'Groups 1–20+',    ja: '1〜20名以上',      zh: '1-20人以上' },

  // ───────── SERVICES ─────────
  'service.label':     { vi: 'DỊCH VỤ',            en: 'SERVICES',        ja: 'サービス',         zh: '服务' },
  'service.title':     { vi: 'Tiện nghi đẳng cấp', en: 'Premium Amenities',ja: '上質なアメニティ',zh: '尊享设施' },
  'service.pool':      { vi: 'Hồ Bơi Vô Cực',      en: 'Infinity Pool',   ja: 'インフィニティプール', zh: '无边泳池' },
  'service.restaurant':{ vi: 'Nhà Hàng Hải Sản',   en: 'Seafood Restaurant',ja: 'シーフードレストラン', zh: '海鲜餐厅' },
  'service.airport':   { vi: 'Đưa Đón Sân Bay',    en: 'Airport Transfer',ja: '空港送迎',         zh: '机场接送' },
  'service.beach':     { vi: 'Đưa Đón Bãi Tắm',    en: 'Beach Shuttle',   ja: 'ビーチシャトル',   zh: '沙滩接送' },
  'service.free':      { vi: 'Miễn phí',           en: 'Free',            ja: '無料',             zh: '免费' },
  'service.request':   { vi: 'Theo yêu cầu',       en: 'On Request',      ja: 'リクエスト',       zh: '按需提供' },

  // ───────── OFFERS ─────────
  'offer.label':       { vi: 'ƯU ĐÃI',             en: 'OFFERS',          ja: '特典',             zh: '优惠' },
  'offer.title':       { vi: 'Ưu đãi đặc biệt',    en: 'Special Offers',  ja: '特別オファー',     zh: '特别优惠' },
  'offer.save':        { vi: 'Tiết kiệm',          en: 'Save',            ja: '節約',             zh: '节省' },
  'offer.vip1':        { vi: 'Đặt từ 2 lần: giảm 5%',  en: '2+ stays: 5% off',  ja: '2回以上:5%割引',  zh: '2次以上享5%折扣' },
  'offer.vip2':        { vi: 'Đặt từ 5 lần: giảm 10%', en: '5+ stays: 10% off', ja: '5回以上:10%割引', zh: '5次以上享10%折扣' },
  'offer.group':       { vi: 'Đoàn 30+ người: 5–10%',  en: 'Groups 30+: 5–10% off', ja: '30名以上:5〜10%割引', zh: '30人以上:5-10%折扣' },
  'offer.view_all':    { vi: 'Xem tất cả ưu đãi',  en: 'View all offers', ja: 'すべての特典',     zh: '查看全部优惠' },

  // ───────── REVIEWS ─────────
  'review.label':      { vi: 'ĐÁNH GIÁ',           en: 'REVIEWS',         ja: 'レビュー',         zh: '评价' },
  'review.title':      { vi: 'Khách hàng nói gì',  en: 'What guests say', ja: 'お客様の声',       zh: '客人评价' },
  'review.score':      { vi: 'Trên cả tuyệt vời',  en: 'Exceptional',     ja: '素晴らしい',       zh: '超级棒' },
  'review.satisfied':  { vi: 'hài lòng',           en: 'satisfied',       ja: '満足',             zh: '满意' },

  // ───────── PROMOTIONS ─────────
  'promo.label':       { vi: 'KHUYẾN MÃI',         en: 'PROMOTIONS',      ja: 'プロモーション',   zh: '促销活动' },
  'promo.view_all':    { vi: 'Xem tất cả',         en: 'View All',        ja: 'すべて見る',       zh: '查看全部' },

  // ───────── FOOTER ─────────
  'footer.hotel_info': { vi: 'Thông tin khách sạn',en: 'Hotel Information',ja: 'ホテル情報',      zh: '酒店信息' },
  'footer.contact':    { vi: 'Liên hệ',            en: 'Contact',         ja: 'お問合せ',         zh: '联系方式' },
  'footer.address':    { vi: 'LK29-20, FLC Sầm Sơn, Thanh Hóa', en: 'LK29-20, FLC Sam Son, Thanh Hoa, Vietnam', ja: 'ベトナム・タインホア省サムソン市FLC LK29-20', zh: '越南清化省三山市FLC度假村 LK29-20' },
  'footer.address_short':{vi:'FLC Sầm Sơn, Thanh Hóa, Việt Nam', en: 'FLC Sầm Sơn, Thanh Hóa, Vietnam', ja: 'FLCサムソン・タインホア・ベトナム', zh: 'FLC岑山·清化·越南' },
  'footer.find_us':    { vi: 'Tìm chúng tôi',      en: 'Find Us',         ja: '所在地',           zh: '位置' },
  'footer.checkin':    { vi: 'Check-in: 14:00',    en: 'Check-in: 2:00 PM',ja: 'チェックイン:14時',zh: '入住:下午2点' },
  'footer.checkout':   { vi: 'Check-out: 12:00',   en: 'Check-out: 12:00 PM',ja: 'チェックアウト:12時',zh: '退房:中午12点' },
  'footer.cta_label':  { vi: 'Liên hệ ngay',       en: 'Get in Touch',    ja: 'お問い合わせ',     zh: '立即联系' },
  'footer.cta_title':  { vi: 'Đặt phòng ngay hôm nay', en: 'Book Your Stay Today', ja: '今日すぐご予約', zh: '今天就预订' },
  'footer.cta_text':   { vi: 'Liên hệ trực tiếp để nhận giá tốt nhất và các ưu đãi độc quyền dành riêng cho bạn.', en: 'Contact us directly for the best rates and exclusive offers just for you.', ja: '最安値と限定オファーをご提供するため、直接お問い合わせください。', zh: '直接联系我们以获得最优价格和专属优惠。' },
  'footer.explore':    { vi: 'Khám phá',           en: 'Explore',         ja: 'コンテンツ',       zh: '探索' },
  'footer.book_via':   { vi: 'Đặt phòng qua',      en: 'Book via',        ja: '予約サイト',       zh: '预订平台' },
  'footer.desc':       { vi: 'Khách sạn nghỉ dưỡng cao cấp tại FLC Sầm Sơn với tầm nhìn biển tuyệt đẹp và dịch vụ đẳng cấp quốc tế.', en: 'Premium resort hotel at FLC Sầm Sơn with stunning ocean views and world-class service.', ja: 'FLCサムソンのプレミアムリゾートホテル。素晴らしい海の景色と世界クラスのサービス。', zh: 'FLC岑山高级度假酒店，拥有壮丽的海景和世界级服务。' },

  // ───────── PLATFORMS / OTA ─────────
  'platforms.title':   { vi: 'Có mặt trên nền tảng quốc tế', en: 'Listed on International Platforms', ja: '国際プラットフォームに掲載', zh: '国际平台上线' },
  'platforms.view_on': { vi: 'Xem trên',           en: 'View on',         ja: 'で見る',           zh: '查看' },
  'platforms.direct':  { vi: 'Đặt trực tiếp giá tốt hơn!', en: 'Book direct for best price!', ja: '直接予約がお得！', zh: '直接预订更优惠！' },

  // ───────── COMMON ─────────
  'common.book_direct':{ vi: 'Đặt trực tiếp — Giá tốt nhất', en: 'Book Direct — Best Price Guaranteed', ja: '直接予約 — 最安値保証', zh: '直接预订 — 最低价保证' },
  'common.no_fee':     { vi: 'Không phí trung gian',en: 'No intermediary fees', ja: '仲介手数料なし', zh: '无中间商费用' },
  'common.confirm_email':{vi:'Xác nhận gửi qua email',en: 'Confirmation sent by email', ja: 'メールで確認書を送信', zh: '确认邮件已发送' },
  'common.loading':    { vi: 'Đang tải...',        en: 'Loading...',      ja: '読み込み中...',    zh: '加载中...' },
  'common.close':      { vi: 'Đóng',               en: 'Close',           ja: '閉じる',           zh: '关闭' },
  'common.save':       { vi: 'Lưu',                en: 'Save',            ja: '保存',             zh: '保存' },
  'common.cancel':     { vi: 'Hủy',                en: 'Cancel',          ja: 'キャンセル',       zh: '取消' },
  'common.continue':   { vi: 'Tiếp tục',           en: 'Continue',        ja: '続ける',           zh: '继续' },
  'common.back':       { vi: 'Quay lại',           en: 'Back',            ja: '戻る',             zh: '返回' },

  // ───────── CHATBOT ─────────
  'chatbot.title':     { vi: 'Lễ tân AI',          en: 'AI Concierge',    ja: 'AIコンシェルジュ', zh: 'AI礼宾' },
  'chatbot.placeholder':{vi:'Nhập tin nhắn...',    en: 'Type a message...',ja: 'メッセージを入力...', zh: '输入消息...' },
  'chatbot.welcome':   { vi: 'Xin chào! Tôi là lễ tân AI của Tuấn Đạt Luxury. Tôi có thể giúp gì cho bạn?', en: "Hello! I'm the AI concierge at Tuấn Đạt Luxury. How can I help you?", ja: 'こんにちは！Tuấn Đạt LuxuryのAIコンシェルジュです。ご用件をどうぞ。', zh: '您好！我是Tuấn Đạt Luxury的AI礼宾。请问有什么可以帮您的？' },
};

/** Lấy chuỗi theo key + ngôn ngữ. Fallback: vi → key. */
export function translate(key: string, lang: Language): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.vi || key;
}
