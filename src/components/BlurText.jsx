import { useEffect, useMemo, useRef, useState } from 'react';
import { useSprings, animated } from '@react-spring/web';

const defaultAnimationFrom = {
  filter: 'blur(12px)',
  opacity: 0,
  transform: 'translate3d(0,-40px,0)'
};

const defaultAnimationTo = [
  {
    filter: 'blur(6px)',
    opacity: 0.45,
    transform: 'translate3d(0,8px,0)'
  },
  {
    filter: 'blur(0px)',
    opacity: 1,
    transform: 'translate3d(0,0,0)'
  }
];

export function BlurText({
  text = '',
  className = '',
  delay = 160,
  animateBy = 'words',
  direction = 'top',
  threshold = 0.15,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = 'easeOutCubic',
  onAnimationComplete
}) {
  const elements = useMemo(
    () => (animateBy === 'letters' ? text.split('') : text.split(' ')),
    [animateBy, text]
  );
  const [inView, setInView] = useState(false);
  const ref = useRef(null);
  const animatedCount = useRef(0);

  const from = useMemo(() => {
    if (animationFrom) return animationFrom;
    if (direction === 'bottom') {
      return { ...defaultAnimationFrom, transform: 'translate3d(0,40px,0)' };
    }
    return defaultAnimationFrom;
  }, [animationFrom, direction]);

  const to = useMemo(() => {
    if (animationTo) return animationTo;
    if (direction === 'bottom') {
      return defaultAnimationTo.map((step, index) =>
        index === 0
          ? { ...step, transform: 'translate3d(0,-8px,0)' }
          : step
      );
    }
    return defaultAnimationTo;
  }, [animationTo, direction]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  const springs = useSprings(
    elements.length,
    elements.map((_, index) => ({
      from,
      to: inView
        ? async next => {
            for (const step of to) {
              await next(step);
            }
            animatedCount.current += 1;
            if (animatedCount.current === elements.length) {
              onAnimationComplete?.();
            }
          }
        : from,
      delay: index * delay,
      config: { easing }
    }))
  );

  return (
    <p ref={ref} className={`blur-text ${className}`}>
      {springs.map((styles, index) => (
        <animated.span
          key={index}
          style={{
            ...styles,
            display: 'inline-block',
            willChange: 'transform, filter, opacity'
          }}
        >
          {elements[index] === ' ' ? '\u00A0' : elements[index]}
          {animateBy === 'words' && index < elements.length - 1 ? '\u00A0' : ''}
        </animated.span>
      ))}
    </p>
  );
}
