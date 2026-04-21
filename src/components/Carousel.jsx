import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Carousel({ title, children }) {
  const scrollContainerRef = useRef(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-10 relative group">
      {/* Title */}
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-primary rounded-full inline-block"></span>
        {title}
      </h2>

      {/* Navigation Buttons (visible on hover) */}
      <button 
        onClick={scrollLeft}
        className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-primary transition-all duration-300 shadow-xl border border-white/10 hover:scale-110 hidden md:flex"
      >
        <ChevronLeft size={24} />
      </button>

      <button 
        onClick={scrollRight}
        className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-primary transition-all duration-300 shadow-xl border border-white/10 hover:scale-110 hidden md:flex"
      >
        <ChevronRight size={24} />
      </button>

      {/* Viewport for Scroller */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-5 overflow-x-auto pb-6 pt-2 custom-scrollbar snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Hide scrollbar for standard browsers
      >
        {React.Children.map(children, (child) => (
          <div className="shrink-0 w-[280px] snap-start">
            {child}
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
    </div>
  );
}
