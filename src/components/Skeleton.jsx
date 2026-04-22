import React from 'react';

export default function Skeleton() {
  return (
    <div className="space-y-12 md:space-y-16 animate-pulse max-w-[1800px] mx-auto p-4 md:p-12">
      {/* Hero Skeleton */}
      <div className="w-full h-[40vh] md:h-[60vh] bg-white/5 rounded-[2rem]"></div>
      
      {/* Rows Skeletons */}
      {[1, 2, 3].map(row => (
        <div key={row} className="space-y-6">
          <div className="h-8 w-48 bg-white/5 rounded-full"></div>
          <div className="flex gap-4 md:gap-6 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="w-[140px] md:w-[260px] aspect-[2/3] bg-white/5 rounded-xl shrink-0"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
