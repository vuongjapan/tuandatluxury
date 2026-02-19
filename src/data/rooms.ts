import roomStandard from '@/assets/room-standard.jpg';
import roomDeluxe from '@/assets/room-deluxe.jpg';
import roomSuite from '@/assets/room-suite.jpg';
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
  weekendMultiplier: number;
  peakMultiplier: number;
}

export const rooms: Room[] = [
  {
    id: 'standard',
    name: { vi: 'Phòng Standard', en: 'Standard Room', ja: 'スタンダードルーム', zh: '标准间' },
    description: {
      vi: 'Phòng tiêu chuẩn thoải mái với đầy đủ tiện nghi, tầm nhìn thành phố.',
      en: 'Comfortable standard room with full amenities and city view.',
      ja: '快適なスタンダードルーム、市街の眺め。',
      zh: '舒适的标准间，配有完整设施和城市景观。',
    },
    priceVND: 800000,
    capacity: 2,
    size: 25,
    amenities: ['wifi', 'ac', 'tv', 'minibar', 'safe'],
    image: roomStandard,
    weekendMultiplier: 1.3,
    peakMultiplier: 1.5,
  },
  {
    id: 'deluxe',
    name: { vi: 'Phòng Deluxe', en: 'Deluxe Room', ja: 'デラックスルーム', zh: '豪华间' },
    description: {
      vi: 'Phòng sang trọng với ban công riêng, tầm nhìn biển tuyệt đẹp.',
      en: 'Luxurious room with private balcony and stunning ocean view.',
      ja: '専用バルコニー付きの豪華な客室、海の絶景。',
      zh: '豪华客房，配有私人阳台和壮丽海景。',
    },
    priceVND: 1800000,
    capacity: 2,
    size: 35,
    amenities: ['wifi', 'ac', 'tv', 'minibar', 'safe', 'balcony', 'bathtub', 'ocean_view'],
    image: roomDeluxe,
    weekendMultiplier: 1.3,
    peakMultiplier: 1.6,
  },
  {
    id: 'suite',
    name: { vi: 'Phòng Suite', en: 'Suite Room', ja: 'スイートルーム', zh: '套房' },
    description: {
      vi: 'Suite cao cấp với phòng khách riêng, bồn tắm jacuzzi và dịch vụ VIP.',
      en: 'Premium suite with separate living room, jacuzzi and VIP service.',
      ja: 'リビング、ジャグジー付きプレミアムスイート、VIPサービス。',
      zh: '高级套房，配有独立客厅、按摩浴缸和VIP服务。',
    },
    priceVND: 3500000,
    capacity: 4,
    size: 60,
    amenities: ['wifi', 'ac', 'tv', 'minibar', 'safe', 'balcony', 'bathtub', 'ocean_view', 'jacuzzi', 'living_room'],
    image: roomSuite,
    weekendMultiplier: 1.2,
    peakMultiplier: 1.5,
  },
  {
    id: 'family',
    name: { vi: 'Phòng Family', en: 'Family Room', ja: 'ファミリールーム', zh: '家庭房' },
    description: {
      vi: 'Phòng rộng rãi dành cho gia đình, 2 giường, không gian vui chơi cho trẻ.',
      en: 'Spacious family room with 2 beds and kids play area.',
      ja: '2ベッド、キッズエリア付きの広々ファミリールーム。',
      zh: '宽敞的家庭房，配有2张床和儿童游乐区。',
    },
    priceVND: 2000000,
    capacity: 4,
    size: 45,
    amenities: ['wifi', 'ac', 'tv', 'minibar', 'safe', 'balcony', 'kids_area', 'extra_bed'],
    image: roomFamily,
    weekendMultiplier: 1.3,
    peakMultiplier: 1.5,
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
