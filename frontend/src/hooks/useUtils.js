import { useEffect, useRef, useState } from 'react';

export function useScrollReveal(threshold = 0.15) {
  const ref = useRef();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

export function useCountUp(end, duration = 2000, start = 0) {
  const [value, setValue] = useState(start);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShouldAnimate(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldAnimate) return;
    const startTime = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [shouldAnimate, end, duration, start]);

  return [ref, value];
}

export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

export function useAutoSave(key, data, interval = 30000) {
  useEffect(() => {
    const timer = setInterval(() => {
      if (data) localStorage.setItem(key, JSON.stringify(data));
    }, interval);
    return () => clearInterval(timer);
  }, [key, data, interval]);

  return () => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  };
}
