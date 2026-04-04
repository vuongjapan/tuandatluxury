import React, { createContext, useContext, useState, useCallback } from 'react';

export type Language = 'vi' | 'en' | 'ja' | 'zh';
export type Currency = 'VND' | 'USD' | 'JPY' | 'CNY';

const CURRENCY_MAP: Record<Language, Currency> = {
  vi: 'VND', en: 'USD', ja: 'JPY', zh: 'CNY',
};

const EXCHANGE_RATES: Record<Currency, number> = {
  VND: 1, USD: 0.00004, JPY: 0.006, CNY: 0.00029,
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  VND: '₫', USD: '$', JPY: '¥', CNY: '¥',
};

const LANG_LABELS: Record<Language, string> = {
  vi: 'Tiếng Việt', en: 'English', ja: '日本語', zh: '中文',
};

interface LanguageContextType {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  formatPrice: (priceVND: number) => string;
  langLabels: typeof LANG_LABELS;
}

const translations: Record<string, Record<Language, string>> = {
  'nav.overview': { vi: 'Tổng quan', en: 'Overview', ja: '概要', zh: '概览' },
  'nav.rooms': { vi: 'Hạng phòng', en: 'Room Types', ja: '客室タイプ', zh: '房型' },
  'nav.booking': { vi: 'Đặt phòng', en: 'Booking', ja: '予約', zh: '预订' },
  'nav.about': { vi: 'Giới thiệu', en: 'About', ja: '紹介', zh: '关于' },
  'nav.services': { vi: 'Dịch vụ', en: 'Services', ja: 'サービス', zh: '服务' },
  'nav.dining': { vi: 'Ẩm thực', en: 'Dining', ja: 'お食事', zh: '餐饮' },
  'nav.food_order': { vi: 'Đặt đồ ăn', en: 'Food Order', ja: 'フードオーダー', zh: '点餐' },
  'nav.policies': { vi: 'Quy định', en: 'Policies', ja: '規定', zh: '规定' },
  'nav.gallery': { vi: 'Thư viện ảnh', en: 'Gallery', ja: 'ギャラリー', zh: '图库' },
  'nav.offers': { vi: 'Ưu đãi', en: 'Offers', ja: '特典', zh: '优惠' },
  'nav.contact': { vi: 'Liên hệ', en: 'Contact', ja: 'お問合せ', zh: '联系' },
  'hero.title': { vi: 'Tuấn Đạt Luxury', en: 'Tuấn Đạt Luxury', ja: 'Tuấn Đạt Luxury', zh: 'Tuấn Đạt Luxury' },
  'hero.subtitle': { vi: 'Trải nghiệm nghỉ dưỡng đẳng cấp bên bờ biển Sầm Sơn', en: 'Premium beachside resort experience in Sầm Sơn', ja: 'サムソンビーチのプレミアムリゾート体験', zh: '岑山海滩高级度假体验' },
  'hero.book_now': { vi: 'Đặt phòng ngay', en: 'Book Now', ja: '今すぐ予約', zh: '立即预订' },
  'search.checkin': { vi: 'Ngày nhận phòng', en: 'Check-in', ja: 'チェックイン', zh: '入住日期' },
  'search.checkout': { vi: 'Ngày trả phòng', en: 'Check-out', ja: 'チェックアウト', zh: '退房日期' },
  'search.guests': { vi: 'Số khách', en: 'Guests', ja: 'ゲスト数', zh: '人数' },
  'search.search': { vi: 'Tìm phòng', en: 'Search', ja: '検索', zh: '搜索' },
  'room.per_night': { vi: '/đêm', en: '/night', ja: '/泊', zh: '/晚' },
  'room.view_detail': { vi: 'Xem chi tiết', en: 'View Details', ja: '詳細を見る', zh: '查看详情' },
  'room.book': { vi: 'Đặt phòng', en: 'Book Now', ja: '予約する', zh: '预订' },
  'room.capacity': { vi: 'Sức chứa', en: 'Capacity', ja: '定員', zh: '容量' },
  'room.size': { vi: 'Diện tích', en: 'Size', ja: '面積', zh: '面积' },
  'room.amenities': { vi: 'Tiện nghi', en: 'Amenities', ja: 'アメニティ', zh: '设施' },
  'booking.title': { vi: 'Đặt phòng', en: 'Booking', ja: '予約', zh: '预订' },
  'booking.guest_info': { vi: 'Thông tin khách', en: 'Guest Information', ja: 'ゲスト情報', zh: '客人信息' },
  'booking.full_name': { vi: 'Họ tên', en: 'Full Name', ja: 'お名前', zh: '姓名' },
  'booking.email': { vi: 'Email', en: 'Email', ja: 'メール', zh: '邮箱' },
  'booking.phone': { vi: 'Số điện thoại', en: 'Phone', ja: '電話番号', zh: '电话' },
  'booking.notes': { vi: 'Ghi chú', en: 'Notes', ja: '備考', zh: '备注' },
  'booking.summary': { vi: 'Tóm tắt đặt phòng', en: 'Booking Summary', ja: '予約概要', zh: '预订摘要' },
  'booking.total': { vi: 'Tổng cộng', en: 'Total', ja: '合計', zh: '总计' },
  'booking.confirm': { vi: 'Xác nhận đặt phòng', en: 'Confirm Booking', ja: '予約確認', zh: '确认预订' },
  'booking.nights': { vi: 'đêm', en: 'nights', ja: '泊', zh: '晚' },
  'booking.rooms_count': { vi: 'Số phòng', en: 'Rooms', ja: '部屋数', zh: '房间数量' },
  'booking.processing': { vi: 'Đang xử lý...', en: 'Processing...', ja: '処理中...', zh: '处理中...' },
  'footer.hotel_info': { vi: 'Thông tin khách sạn', en: 'Hotel Information', ja: 'ホテル情報', zh: '酒店信息' },
  'footer.contact': { vi: 'Liên hệ', en: 'Contact', ja: 'お問合せ', zh: '联系方式' },
  'footer.address': { vi: 'Địa chỉ', en: 'Address', ja: '住所', zh: '地址' },
  'footer.find_us': { vi: 'Tìm chúng tôi', en: 'Find Us', ja: '所在地', zh: '位置' },
  'footer.desc': { vi: 'Khách sạn nghỉ dưỡng cao cấp tại FLC Sầm Sơn với tầm nhìn biển tuyệt đẹp và dịch vụ đẳng cấp quốc tế.', en: 'Premium resort hotel at FLC Sầm Sơn with stunning ocean views and world-class service.', ja: 'FLCサムソンのプレミアムリゾートホテル。素晴らしい海の景色と世界クラスのサービス。', zh: 'FLC岑山高级度假酒店，拥有壮丽的海景和世界级服务。' },
  'platforms.title': { vi: 'Có mặt trên nền tảng quốc tế', en: 'Listed on International Platforms', ja: '国際プラットフォームに掲載', zh: '国际平台上线' },
  'platforms.view_on': { vi: 'Xem trên', en: 'View on', ja: 'で見る', zh: '查看' },
  'platforms.direct': { vi: 'Đặt trực tiếp giá tốt hơn!', en: 'Book direct for best price!', ja: '直接予約がお得！', zh: '直接预订更优惠！' },
  'chatbot.title': { vi: 'Lễ tân AI', en: 'AI Concierge', ja: 'AIコンシェルジュ', zh: 'AI礼宾' },
  'chatbot.placeholder': { vi: 'Nhập tin nhắn...', en: 'Type a message...', ja: 'メッセージを入力...', zh: '输入消息...' },
  'chatbot.welcome': { vi: 'Xin chào! Tôi là lễ tân AI của Tuấn Đạt Luxury. Tôi có thể giúp gì cho bạn?', en: 'Hello! I\'m the AI concierge at Tuấn Đạt Luxury. How can I help you?', ja: 'こんにちは！Tuấn Đạt LuxuryのAIコンシェルジュです。ご用件をどうぞ。', zh: '您好！我是Tuấn Đạt Luxury的AI礼宾。请问有什么可以帮您的？' },
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('vi');

  const currency = CURRENCY_MAP[language];

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string) => {
    return translations[key]?.[language] || key;
  }, [language]);

  const formatPrice = useCallback((priceVND: number) => {
    const converted = priceVND * EXCHANGE_RATES[currency];
    const symbol = CURRENCY_SYMBOLS[currency];
    if (currency === 'VND') {
      return `${new Intl.NumberFormat('vi-VN').format(converted)}${symbol}`;
    }
    if (currency === 'JPY') {
      return `${symbol}${new Intl.NumberFormat('ja-JP').format(Math.round(converted))}`;
    }
    return `${symbol}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(converted))}`;
  }, [currency]);

  return (
    <LanguageContext.Provider value={{ language, currency, setLanguage, t, formatPrice, langLabels: LANG_LABELS }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
