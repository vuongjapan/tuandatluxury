import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format VND price as short string: 800000 → "800k", 1250000 → "1.250k" */
export function formatPriceShort(price: number): string {
  const k = Math.round(price / 1000);
  return `${k.toLocaleString('vi-VN')}k`;
}

/** Format VND price as full string: 800000 → "800.000đ" */
export function formatPriceFull(price: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(price)}đ`;
}
