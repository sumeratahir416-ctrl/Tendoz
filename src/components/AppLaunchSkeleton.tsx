import React from 'react';

/**
 * AppLaunchSkeleton - Clean, soft, and visually appealing startup skeleton screen
 * Full-screen width on desktop (md/lg/xl) while preserving exact mobile layout (<md).
 *
 * Features:
 * 1. Top bar with rounded pill brand logo/location placeholder on left & 4 icon circles (with active badge on 3rd).
 * 2. Full-screen aspect ratio promotional carousel banner skeleton with bottom pagination dots.
 * 3. Horizontal category capsule pill placeholders.
 * 4. Section heading & subtitle placeholders.
 * 5. Full-width / multi-column product feature banner cards.
 */
export const AppLaunchSkeleton: React.FC = () => {
  return (
    <div
      className="w-full min-h-screen bg-white select-none pointer-events-none font-sans overflow-x-hidden"
      aria-busy="true"
      aria-label="Loading application..."
    >
      {/* 1. TOP HEADER SKELETON */}
      <header className="w-full bg-white border-b border-neutral-200/70 shadow-2xs">
        <div className="w-full px-3 sm:px-6 md:px-10 lg:px-16 xl:px-20 h-16 sm:h-[72px] flex items-center justify-between">
          {/* Left: Rounded Logo / Location Capsule Placeholder */}
          <div className="h-10 w-28 sm:w-36 md:w-48 rounded-2xl skeleton-shimmer" />

          {/* Right: 4 Circular Header Icon Skeletons with Notification Dot */}
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full skeleton-shimmer" />
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full skeleton-shimmer" />
            {/* 3rd Circle with red notification dot badge */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full skeleton-shimmer relative">
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#EF4444] ring-2 ring-white" />
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full skeleton-shimmer" />
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT SKELETON CONTAINER */}
      <main className="w-full px-3 sm:px-6 md:px-10 lg:px-16 xl:px-20 pt-2.5 sm:pt-4 pb-12 space-y-4 sm:space-y-6">
        {/* Promotional Hero Carousel Banner Skeleton */}
        <div className="relative w-full aspect-[2.2/1] sm:aspect-[2.6/1] md:aspect-[3.2/1] rounded-2xl sm:rounded-3xl skeleton-shimmer overflow-hidden shadow-2xs">
          {/* 3 Bottom Carousel Indicator Dots */}
          <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2">
            <div className="w-2 h-2 rounded-full bg-white/70 shadow-xs" />
            <div className="w-7 sm:w-10 h-2 sm:h-2.5 rounded-full bg-white/95 shadow-xs" />
            <div className="w-2 h-2 rounded-full bg-white/70 shadow-xs" />
          </div>
        </div>

        {/* Category Capsules Row (4 capsules on mobile, 6 on desktop) */}
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 pt-0.5">
          <div className="h-11 sm:h-12 md:h-14 rounded-2xl skeleton-shimmer" />
          <div className="h-11 sm:h-12 md:h-14 rounded-2xl skeleton-shimmer" />
          <div className="h-11 sm:h-12 md:h-14 rounded-2xl skeleton-shimmer" />
          <div className="h-11 sm:h-12 md:h-14 rounded-2xl skeleton-shimmer" />
          <div className="hidden md:block h-14 rounded-2xl skeleton-shimmer" />
          <div className="hidden md:block h-14 rounded-2xl skeleton-shimmer" />
        </div>

        {/* Section Heading & Subtitle Placeholders */}
        <div className="pt-2 sm:pt-3 space-y-2">
          <div className="h-7 sm:h-8 md:h-10 w-32 sm:w-44 md:w-64 rounded-xl skeleton-shimmer" />
          <div className="h-3.5 sm:h-4 md:h-5 w-48 sm:w-64 md:w-96 rounded-lg skeleton-shimmer" />
        </div>

        {/* Large Product / Category Feature Cards (1 col on mobile, 2 cols on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-1">
          {/* Card 1 */}
          <div className="w-full aspect-[2.1/1] sm:aspect-[2.5/1] md:aspect-[2.2/1] rounded-2xl sm:rounded-3xl skeleton-shimmer p-4 sm:p-6 flex flex-col justify-end relative overflow-hidden shadow-2xs">
            <div className="space-y-2 z-10">
              <div className="h-4 sm:h-5 md:h-6 w-3/4 sm:w-2/3 rounded-full skeleton-shimmer-subtle" />
              <div className="h-3.5 sm:h-4 md:h-5 w-1/2 sm:w-2/5 rounded-full skeleton-shimmer-subtle" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="w-full aspect-[2.1/1] sm:aspect-[2.5/1] md:aspect-[2.2/1] rounded-2xl sm:rounded-3xl skeleton-shimmer p-4 sm:p-6 flex flex-col justify-end relative overflow-hidden shadow-2xs">
            <div className="space-y-2 z-10">
              <div className="h-4 sm:h-5 md:h-6 w-3/4 sm:w-2/3 rounded-full skeleton-shimmer-subtle" />
              <div className="h-3.5 sm:h-4 md:h-5 w-1/2 sm:w-2/5 rounded-full skeleton-shimmer-subtle" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
