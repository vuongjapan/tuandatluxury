/**
 * <T> — Auto-translate component.
 * Bọc text tiếng Việt; tự dịch sang ngôn ngữ hiện tại (cache 24h).
 *
 * Dùng:
 *   <T>Phòng & Đặt phòng</T>
 *   <T as="h1" className="...">Tiêu đề</T>
 *   <T text={room.description} />
 */
import React from 'react';
import { useAutoTr } from '@/hooks/useAutoTranslate';

interface TProps {
  children?: React.ReactNode;
  text?: string | null;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

const T: React.FC<TProps> = ({ children, text, as, className }) => {
  const source = text ?? (typeof children === 'string' ? children : Array.isArray(children) && children.every((c) => typeof c === 'string') ? children.join('') : '');
  const translated = useAutoTr(source);

  if (as) {
    const Tag = as as any;
    return <Tag className={className}>{translated}</Tag>;
  }
  if (className) return <span className={className}>{translated}</span>;
  return <>{translated}</>;
};

export default T;
