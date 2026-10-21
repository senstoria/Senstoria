import { useEffect, useState } from 'react';

/**
 * Standard motion tokens for Senstoria
 * Rule 10: 150-200 ms ease-out, opacity/translate only (fill bars max 400 ms).
 * Respects prefers-reduced-motion.
 */
export const MOTION_TOKENS = {
  duration: {
    instant: 0,
    fast: 0.15, // 150ms
    base: 0.2,  // 200ms
    fillBar: 0.4 // 400ms max for bottle level bars
  },
  ease: [0.0, 0.0, 0.2, 1.0] as const, // cubic-bezier ease-out
  cssEase: 'cubic-bezier(0, 0, 0.2, 1)'
};

/**
 * Hook to detect if the user has requested reduced motion.
 * Returns true if prefers-reduced-motion: reduce is enabled.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    } else {
      // Legacy fallback
      mediaQuery.addListener(onChange);
      return () => mediaQuery.removeListener(onChange);
    }
  }, []);

  return prefersReduced;
}

/**
 * Transition configurations for Framer Motion components
 */
export const transitions = {
  fade: (reduced: boolean) => ({
    duration: reduced ? 0 : MOTION_TOKENS.duration.base,
    ease: MOTION_TOKENS.ease
  }),
  slideFade: (reduced: boolean) => ({
    duration: reduced ? 0 : MOTION_TOKENS.duration.base,
    ease: MOTION_TOKENS.ease
  }),
  fillBarCss: (reduced: boolean) => 
    reduced ? 'none' : `width ${MOTION_TOKENS.duration.fillBar}s ${MOTION_TOKENS.cssEase}`
};
