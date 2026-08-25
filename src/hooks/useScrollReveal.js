import { useEffect } from 'react';

/**
 * Custom hook for smooth, high-performance scroll-triggered animations.
 * Uses native IntersectionObserver to avoid continuous scroll event execution.
 * Respects 'prefers-reduced-motion' for full accessibility.
 */
export function useScrollReveal(dependencies = []) {
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      document.querySelectorAll('.reveal-init, .reveal-fade-left, .reveal-fade-right, .reveal-scale').forEach(el => {
        el.classList.add('revealed');
      });
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('.reveal-init, .reveal-fade-left, .reveal-fade-right, .reveal-scale').forEach(el => {
        el.classList.add('revealed');
      });
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.reveal-init, .reveal-fade-left, .reveal-fade-right, .reveal-scale');
    elements.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, dependencies);
}

export default useScrollReveal;
