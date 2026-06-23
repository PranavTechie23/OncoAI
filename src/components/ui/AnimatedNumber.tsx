import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number | string;
  duration?: number;
  decimals?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  separator?: string;
  onComplete?: () => void;
}

export default function AnimatedNumber({
  value,
  duration = 2000,
  decimals = 0,
  className = '',
  prefix = '',
  suffix = '',
  separator = ',',
  onComplete,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [inView, setInView] = useState(false);
  
  const spanRef = useRef<HTMLSpanElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousValueRef = useRef<number | string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (spanRef.current) {
      observer.observe(spanRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  // Parse the value to get the numeric part
  const parseValue = (val: number | string): number => {
    if (typeof val === 'number') return val;
    
    // Handle strings like "10K+", "99.8%", "24/7", "100%"
    const cleaned = val.toString().replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Format the number with separators and decimals
  const formatNumber = (num: number): string => {
    const fixed = num.toFixed(decimals);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return parts.join('.');
  };

  // Extract suffix from original value if it's a string
  const extractSuffix = (val: number | string): string => {
    if (typeof val === 'string') {
      const match = val.match(/[^0-9.]+/);
      return match ? match[0] : '';
    }
    return suffix;
  };

  const numericValue = parseValue(value);
  const finalSuffix = typeof value === 'string' ? extractSuffix(value) : suffix;

  useEffect(() => {
    if (!inView) return;

    // Reset if value changed
    if (previousValueRef.current !== value) {
      previousValueRef.current = value;
      setDisplayValue(0);
      setIsAnimating(true);
      startTimeRef.current = null;

      const animate = (currentTime: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = currentTime;
        }

        const elapsed = currentTime - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = numericValue * easeOutQuart;

        setDisplayValue(currentValue);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(numericValue);
          setIsAnimating(false);
          if (onComplete) onComplete();
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, numericValue, duration, onComplete, inView]);

  // Format the display value
  const formattedValue = formatNumber(displayValue);

  return (
    <span ref={spanRef} className={className}>
      {prefix}
      {formattedValue}
      {finalSuffix}
    </span>
  );
}
