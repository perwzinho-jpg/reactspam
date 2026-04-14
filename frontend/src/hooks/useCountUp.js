import { useState, useEffect, useRef } from 'react';

export function useCountUp(end, options = {}) {
  const {
    start = 0,
    duration = 2000,
    decimals = 0,
    isVisible = true,
    suffix = '',
    prefix = ''
  } = options;

  const [count, setCount] = useState(start);
  const hasAnimated = useRef(false);
  const frameRef = useRef();

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;

    hasAnimated.current = true;
    const startTime = performance.now();
    const startValue = start;
    const endValue = end;
    const totalChange = endValue - startValue;

    const easeOutQuad = (t) => t * (2 - t);

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        const easedProgress = easeOutQuad(progress);
        const currentValue = startValue + (totalChange * easedProgress);
        setCount(currentValue);
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [start, end, duration, isVisible]);

  let formattedCount;

  if (decimals > 0) {
    formattedCount = count.toFixed(decimals);
  } else {
    const rounded = Math.floor(count);
    // Format large numbers with K suffix
    if (rounded >= 10000) {
      formattedCount = (rounded / 1000).toFixed(0) + 'K';
    } else if (rounded >= 1000) {
      formattedCount = rounded.toLocaleString('pt-BR');
    } else {
      formattedCount = rounded.toString();
    }
  }

  return prefix + formattedCount + suffix;
}
