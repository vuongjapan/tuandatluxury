import roomStandard from '@/assets/room-standard.jpg';
import roomDeluxe from '@/assets/room-deluxe.jpg';
import roomFamily from '@/assets/room-family.jpg';

export interface Room {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  priceVND: number;
  capacity: number;
  size: number;
  amenities: string[];
  image: string;
  images?: string[];
  weekendMultiplier: number;
  peakMultiplier: number;
  totalRooms: number;
  bedType: string;
  viewType: string;
  hasBalcony: boolean;
}

export const rooms: Room[] = [
  {
    id: 'standard',
    name: { vi: 'Phòng Đơn Deluxe Double', en: 'Deluxe Double Room', ja: 'デラックスダブルルーム', zh: '豪华双人房' },
    description: {
      vi: 'Phòng tiêu chuẩn thoải mái với đầy đủ tiện nghi, tầm nhìn thành phố.',
      en: 'Comfortable standard room with full amenities and city view.',
      ja: '快適なスタンダードルーム、市街の眺め。',
      zh: '舒适的标准间，配有完整设施和城市景观。',
    },
    priceVND: 800000,
    capacity: 2,
    size: 30,
    amenities: ['wifi', 'ac', 'tv', 'minibar', 'safe'],
    image: roomStandard,
    weekendMultiplier: 1.3,
    peakMultiplier: 1.5,
    totalRooms: 4,
    bedType: '1 giường đôi lớn',
    viewType: 'View thành phố',
    hasBalcony: false,
  },
  {
    id: 'deluxe',
    name: { vi: 'Phòng Đôi Deluxe Twin', en: 'Deluxe Twin Room', ja: 'デラックスツインルーム', zh: '豪华双床房' },
    description: {
      vi: 'Phòng tiêu chuẩn thoải mái với đầy đủ tiện nghi, tầm nhìn thành phố.',
      en: 'Comfortable room with full amenities and city view.',
      ja: '快適なツインルーム、市街の眺め。',
      zh: '舒适的双床房，配有完整设施和城市景观。',
    },
    priceVND: 800000,
    capacity: 4,
    size: 30,
    amenities: ['wifi', 'ac', 'tv', 'minibar', 'safe'],
    image: roomDeluxe,
    weekendMultiplier: 1.3,
    peakMultiplier: 1.5,
    totalRooms: 8,
    bedType: '2 giường đôi lớn',
    viewType: 'View thành phố',
    hasBalcony: false,
  },
  {
    id: 'family',
    name: { vi: 'Phòng Đôi VIP', en: 'VIP Twin Room', ja: 'VIPツインルーム', zh: 'VIP双床房' },
    description: {
      vi: 'Phòng sang trọng với ban công riêng, tầm nhìn biển và thành phố tuyệt đẹp.',
      en: 'Luxurious room with private balcony and stunning ocean & city view.',
      ja: '専用バルコニー付きの豪華な客室、海の絶景。',
      zh: '豪华客房，配有私人阳台和壮丽海景。',
    },
    priceVND: 1800000,
    capacity: 4,
    size: 35,
    amenities: ['wifi', 'ac', 'tv', 'minibar', 'safe', 'balcony', 'ocean_view'],
    image: roomFamily,
    weekendMultiplier: 1.3,
    peakMultiplier: 1.6,
    totalRooms: 7,
    bedType: '2 giường lớn',
    viewType: 'View biển + thành phố',
    hasBalcony: true,
  },
];

export const AMENITY_ICONS: Record<string, { icon: string; label: Record<string, string> }> = {
  wifi: { icon: 'Wifi', label: { vi: 'WiFi', en: 'WiFi', ja: 'WiFi', zh: 'WiFi' } },
  ac: { icon: 'Snowflake', label: { vi: 'Điều hòa', en: 'A/C', ja: 'エアコン', zh: '空调' } },
  tv: { icon: 'Tv', label: { vi: 'TV', en: 'TV', ja: 'テレビ', zh: '电视' } },
  minibar: { icon: 'Wine', label: { vi: 'Minibar', en: 'Minibar', ja: 'ミニバー', zh: '迷你吧' } },
  safe: { icon: 'Lock', label: { vi: 'Két sắt', en: 'Safe', ja: '金庫', zh: '保险箱' } },
  balcony: { icon: 'Sun', label: { vi: 'Ban công', en: 'Balcony', ja: 'バルコニー', zh: '阳台' } },
  bathtub: { icon: 'Bath', label: { vi: 'Bồn tắm', en: 'Bathtub', ja: 'バスタブ', zh: '浴缸' } },
  ocean_view: { icon: 'Waves', label: { vi: 'View biển', en: 'Ocean View', ja: 'オーシャンビュー', zh: '海景' } },
  jacuzzi: { icon: 'Sparkles', label: { vi: 'Jacuzzi', en: 'Jacuzzi', ja: 'ジャグジー', zh: '按摩浴缸' } },
  living_room: { icon: 'Sofa', label: { vi: 'Phòng khách', en: 'Living Room', ja: 'リビング', zh: '客厅' } },
  kids_area: { icon: 'Baby', label: { vi: 'Khu vui chơi trẻ em', en: 'Kids Area', ja: 'キッズエリア', zh: '儿童区' } },
  extra_bed: { icon: 'BedDouble', label: { vi: 'Giường phụ', en: 'Extra Bed', ja: 'エキストラベッド', zh: '加床' } },
};

export const PEAK_MONTHS = [6, 7, 8]; // Summer peak

export function getRoomPrice(room: Room, date: Date): number {
  const month = date.getMonth() + 1;
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  const isPeak = PEAK_MONTHS.includes(month);

  let price = room.priceVND;
  if (isWeekend) price *= room.weekendMultiplier;
  if (isPeak) price *= room.peakMultiplier;

  return Math.round(price / 1000) * 1000;
}
