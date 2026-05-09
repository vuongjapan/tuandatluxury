import { useEffect, RefObject } from 'react';

/**
 * Enable click-and-drag + mouse wheel horizontal scrolling on desktop.
 * Touch swipe on mobile is preserved (we don't touch touch events).
 */
export function useDragScroll<T extends HTMLElement>(ref: RefObject<T>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip on touch-primary devices to keep native momentum scrolling
    const isTouch = window.matchMedia('(hover: none)').matches;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let moved = false;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      moved = false;
      el.style.cursor = 'grabbing';
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const stop = () => {
      isDown = false;
      el.style.cursor = 'grab';
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.4;
      if (Math.abs(walk) > 4) moved = true;
      el.scrollLeft = scrollLeft - walk;
    };
    // Prevent click after drag
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      // Only hijack when the container can actually scroll horizontally
      if (el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    if (!isTouch) {
      el.style.cursor = 'grab';
      el.addEventListener('mousedown', onMouseDown);
      el.addEventListener('mouseleave', stop);
      el.addEventListener('mouseup', stop);
      el.addEventListener('mousemove', onMouseMove);
      el.addEventListener('click', onClickCapture, true);
      el.addEventListener('wheel', onWheel, { passive: false });
    }

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', stop);
      el.removeEventListener('mouseup', stop);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('click', onClickCapture, true);
      el.removeEventListener('wheel', onWheel);
    };
  }, [ref]);
}
