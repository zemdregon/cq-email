import { useEffect, useMemo, useRef, useState } from 'react';
import { useSprings, animated, easings as springEasings } from '@react-spring/web';

const defaultAnimationFrom = {
  filter: 'blur(8px)',
  opacity: 0,
  transform: 'translate3d(0,-20px,0)'
};

const defaultAnimationTo = [
  {
    filter: 'blur(3px)',
    opacity: 0.6,
    transform: 'translate3d(0,6px,0)'
  },
  {
    filter: 'blur(0px)',
    opacity: 1,
    transform: 'translate3d(0,0,0)'
  }
];

const defaultEasing = springEasings.easeOutCubic;

export function BlurText({
  text = '',
  className = '',
  delay = 70,
  animateBy = 'words',
  direction = 'top',
  threshold = 0.15,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = 'easeOutCubic',
  duration = 180,
  onAnimationComplete
}) {
  const elements = useMemo(
    () => (animateBy === 'letters' ? text.split('') : text.split(' ')),
    [animateBy, text]
  );
  const elementCount = elements.length;
  const [inView, setInView] = useState(false);
  const ref = useRef(null);
  const animatedCount = useRef(0);
  const hasAnimated = useRef(false);

  const from = useMemo(() => {
    if (animationFrom) return animationFrom;
    if (direction === 'bottom') {
      return { ...defaultAnimationFrom, transform: 'translate3d(0,40px,0)' };
    }
    return defaultAnimationFrom;
  }, [animationFrom, direction]);

  const animationSequence = useMemo(() => {
    const resolvedSequence = (() => {
      if (animationTo) return animationTo;
      if (direction === 'bottom') {
        return defaultAnimationTo.map((step, index) =>
          index === 0
            ? { ...step, transform: 'translate3d(0,-8px,0)' }
            : step
        );
      }
      return defaultAnimationTo;
    })();

    return Array.isArray(resolvedSequence) ? resolvedSequence : [resolvedSequence];
  }, [animationTo, direction]);

  const resolvedEasing = useMemo(() => {
    if (typeof easing === 'function') return easing;
    if (typeof easing === 'string' && springEasings[easing]) {
      return springEasings[easing];
    }
    return defaultEasing;
  }, [easing]);

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
    elements.map((_, index) => {
      const finalState = animationSequence[animationSequence.length - 1];
      const shouldAnimate = inView && !hasAnimated.current;

      if (shouldAnimate && index === 0) {
        animatedCount.current = 0;
      }

      return {
        from: shouldAnimate ? from : finalState,
        to: (() => {
          if (!inView) {
            return from;
          }

          if (shouldAnimate) {
            const countTarget = elementCount;
            return async next => {
              for (const step of animationSequence) {
                await next(step);
              }
              animatedCount.current += 1;
              if (animatedCount.current === countTarget) {
                hasAnimated.current = true;
                onAnimationComplete?.();
              }
            };
          }

          return finalState;
        })(),
        delay: shouldAnimate ? index * delay : 0,
        config: { duration, easing: resolvedEasing }
      };
    })
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
