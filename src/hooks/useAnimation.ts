import { useEffect, useRef, useState } from 'react';

/** Returns an animation time value [0, 1) cycling at `speed` cycles / second. */
export function useAnimation(speed = 0.28): number {
  const [time, setTime] = useState(0);
  const rafRef  = useRef<number>(0);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    function tick(ts: number) {
      const dt = lastRef.current != null ? (ts - lastRef.current) / 1000 : 0;
      lastRef.current = ts;
      setTime(t => (t + dt * speed) % 1);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed]);

  return time;
}
