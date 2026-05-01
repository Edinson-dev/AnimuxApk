import React from 'react';

export default function Skeleton() {
  return (
    <div className="space-y-12 md:space-y-16 max-w-[1800px] mx-auto p-4 md:p-12">
      {/* Hero Skeleton */}
      <div className="w-full h-[38vh] md:h-[65vh] shimmer-wrapper rounded-3xl"></div>
      
      {/* Rows Skeletons */}
      {[1, 2, 3].map(row => (
        <div key={row} className="space-y-6">
          <div className="h-8 w-48 shimmer-wrapper rounded-full"></div>
          <div className="flex gap-4 md:gap-6 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="w-[140px] md:w-[260px] aspect-[2/3] shimmer-wrapper rounded-2xl shrink-0"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
