import React, { useRef, useState, useEffect, memo } from 'react';

/**
 * LazyRow: A horizontal scroll row that only renders its children 
 * when visible in the viewport (IntersectionObserver-based).
 * This prevents hundreds of off-screen ChannelCards from mounting/rendering.
 */
const LazyRow = memo(function LazyRow({ children, className = '', placeholderHeight = 220 }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Once visible, keep it rendered forever
        }
      },
      {
        rootMargin: '200px 0px', // Start rendering 200px before it enters viewport
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return (
      <div ref={ref} style={{ minHeight: placeholderHeight }} className={className}>
        {/* Lightweight skeleton placeholder */}
        <div className="flex gap-4 overflow-hidden pb-4 -mx-4 px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[140px] md:w-[220px] shrink-0">
              <div className="aspect-video rounded-2xl bg-white/[0.03] animate-skeleton" />
              <div className="h-3 w-20 mt-2 rounded bg-white/[0.03] animate-skeleton" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <div ref={ref} className={className}>{children}</div>;
});

export default LazyRow;
