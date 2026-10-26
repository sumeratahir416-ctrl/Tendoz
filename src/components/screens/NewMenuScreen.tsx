import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Menu, ArrowRight, Plus, X, Search, Heart, ArrowLeft } from 'lucide-react';
import { MenuItem, ScreenName } from '../../types';
import {
  carouselBanner1Img,
  carouselBanner2Img,
  carouselBanner3Img,
  CHILL_PILL_CATEGORIES,
} from '../../data/initialData';
import { CHILL_PILL_BANNERS } from '../../data/chillPillData';
import { motion, AnimatePresence } from 'motion/react';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import { resolvePopularBadgeItemIds } from '../../utils/popularBadgeUtils';

interface NewMenuScreenProps {
  items: MenuItem[];
  wishlistIds: string[];
  onToggleWishlist: (itemId: string) => void;
  onSelectItem: (item: MenuItem) => void;
  onOrderNow: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem) => void;
  cartCount?: number;
  onOpenCart?: () => void;
  onNavigate: (screen: ScreenName) => void;
}

export const NewMenuScreen: React.FC<NewMenuScreenProps> = ({
  items,
  wishlistIds,
  onToggleWishlist,
  onSelectItem,
  onOrderNow: _onOrderNow,
  onAddToCart,
  cartCount: _cartCount = 0,
  onOpenCart: _onOpenCart,
  onNavigate,
}) => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [direction, setDirection] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>(CHILL_PILL_CATEGORIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [isCategoryScrolling, setIsCategoryScrolling] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [showFloatingButtons, setShowFloatingButtons] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isSearchHighlighted, setIsSearchHighlighted] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasMovedRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const programmaticScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const categoryNavBarRef = useRef<HTMLDivElement>(null);
  const [categoryBarHeight, setCategoryBarHeight] = useState<number>(48);

  const productsGridRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Monitor sticky category navigation bar height
  useEffect(() => {
    const updateBarHeight = () => {
      if (categoryNavBarRef.current) {
        setCategoryBarHeight(categoryNavBarRef.current.offsetHeight);
      }
    };
    updateBarHeight();
    window.addEventListener('resize', updateBarHeight);
    return () => window.removeEventListener('resize', updateBarHeight);
  }, []);

  // Filter items belonging to the new menu
  const newMenuItems = useMemo(() => {
    return items.filter((item) =>
      CHILL_PILL_CATEGORIES.includes(item.category as any)
    );
  }, [items]);

  // Subcategory / Category Popular Badge Distribution: Guaranteed at least one per category + admin database persistence
  const popularBadgeItemIds = useMemo(() => {
    return resolvePopularBadgeItemIds(newMenuItems);
  }, [newMenuItems]);

  // Exact 3:1 commercial promotional banners matching HomeScreen styling
  const banners = [
    {
      id: 0,
      title: 'Tendoz Special Deals & Broast',
      image: carouselBanner1Img,
      alt: 'Tendoz Special Deals & Broast',
      featuredId: 'injected-broast-half',
    },
    {
      id: 1,
      title: 'Tendoz Delicious Burgers & Platters',
      image: carouselBanner2Img,
      alt: 'Tendoz Delicious Burgers & Platters',
      featuredId: 'zingo-burger',
    },
    {
      id: 2,
      title: 'Tendoz Crispy Wings & Sides',
      image: carouselBanner3Img,
      alt: 'Tendoz Crispy Wings & Sides',
      featuredId: 'honey-wings-08-pcs',
    },
  ];

  // Dynamic Typewriter category strings for animated search placeholder
  const typewriterStrings = useMemo(
    () => [
      'Search iced coffee...',
      'Search frappes...',
      'Search boba tea...',
      'Search smoothies...',
      'Search mocktails...',
      'Search nitro ice cream...',
      'Search shakes...',
    ],
    []
  );

  // Smooth typewriter animation
  useEffect(() => {
    if (isSearchFocused) return;

    const currentTarget = typewriterStrings[currentCategoryIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (typewriterText.length < currentTarget.length) {
        timer = setTimeout(() => {
          setTypewriterText(currentTarget.slice(0, typewriterText.length + 1));
        }, 90);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      if (typewriterText.length > 0) {
        timer = setTimeout(() => {
          setTypewriterText(currentTarget.slice(0, typewriterText.length - 1));
        }, 45);
      } else {
        setIsDeleting(false);
        setCurrentCategoryIndex((prev) => (prev + 1) % typewriterStrings.length);
      }
    }

    return () => clearTimeout(timer);
  }, [typewriterText, isDeleting, currentCategoryIndex, isSearchFocused, typewriterStrings]);

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (!searchQuery) {
      setIsDeleting(false);
      setTypewriterText('');
    }
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    if (!searchQuery) {
      setIsDeleting(false);
      setTypewriterText('');
    }
  };

  // Auto-play carousel timer with pause on hover
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, banners.length]);

  const handleNextBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(1);
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const handlePrevBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(-1);
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Scroll category bar into view with drag and bounds checking
  const checkCategoryScrollBounds = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkCategoryScrollBounds();
    window.addEventListener('resize', checkCategoryScrollBounds);
    return () => window.removeEventListener('resize', checkCategoryScrollBounds);
  }, [checkCategoryScrollBounds]);

  const scrollCategoriesLeft = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
      setTimeout(checkCategoryScrollBounds, 250);
    }
  };

  const scrollCategoriesRight = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
      setTimeout(checkCategoryScrollBounds, 250);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - (categoryScrollRef.current?.offsetLeft || 0);
    scrollLeftStartRef.current = categoryScrollRef.current?.scrollLeft || 0;
  };

  const handleMouseLeave = () => {
    isMouseDownRef.current = false;
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !categoryScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (categoryScrollRef.current.offsetLeft || 0);
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasMovedRef.current = true;
    }
    categoryScrollRef.current.scrollLeft = scrollLeftStartRef.current - walk;
    checkCategoryScrollBounds();
  };

  const handleCategoryWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (categoryScrollRef.current && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      categoryScrollRef.current.scrollLeft += e.deltaY;
      checkCategoryScrollBounds();
    }
  };

  // Scroll to active category section
  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    setIsCategorySheetOpen(false);

    if (searchQuery) {
      setSearchQuery('');
    }

    const slug = category.toLowerCase().replace(/\s+/g, '-');
    const targetElement = document.getElementById(`cat-section-${slug}`);

    if (targetElement) {
      isProgrammaticScrollRef.current = true;
      if (programmaticScrollTimerRef.current) {
        clearTimeout(programmaticScrollTimerRef.current);
      }
      setIsCategoryScrolling(true);

      const navBarHeight = categoryNavBarRef.current?.offsetHeight || 48;
      const elementRect = targetElement.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const targetY = Math.max(0, absoluteElementTop - navBarHeight - 12);

      window.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });

      programmaticScrollTimerRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
        setIsCategoryScrolling(false);
      }, 750);
    }

    // Center active button in horizontal pill bar
    if (categoryScrollRef.current) {
      const activeBtn = categoryScrollRef.current.querySelector(
        `[data-category="${category}"]`
      ) as HTMLElement | null;
      if (activeBtn) {
        const container = categoryScrollRef.current;
        const scrollLeft =
          activeBtn.offsetLeft -
          container.clientWidth / 2 +
          activeBtn.clientWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        setTimeout(checkCategoryScrollBounds, 300);
      }
    }
  };

  // Scroll listener for sticky active category tracking and floating buttons
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingButtons(window.scrollY > 400);

      if (isProgrammaticScrollRef.current || searchQuery) return;

      const navBarHeight = categoryNavBarRef.current?.offsetHeight || 48;
      const scrollPosition = window.scrollY + navBarHeight + 80;

      for (let i = CHILL_PILL_CATEGORIES.length - 1; i >= 0; i--) {
        const cat = CHILL_PILL_CATEGORIES[i];
        const slug = cat.toLowerCase().replace(/\s+/g, '-');
        const el = document.getElementById(`cat-section-${slug}`);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveCategory(cat);
            if (categoryScrollRef.current) {
              const activeBtn = categoryScrollRef.current.querySelector(
                `[data-category="${cat}"]`
              ) as HTMLElement | null;
              if (activeBtn) {
                const container = categoryScrollRef.current;
                const scrollLeft =
                  activeBtn.offsetLeft -
                  container.clientWidth / 2 +
                  activeBtn.clientWidth / 2;
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                checkCategoryScrollBounds();
              }
            }
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [searchQuery, checkCategoryScrollBounds]);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsSearchHighlighted(true);
      setTimeout(() => setIsSearchHighlighted(false), 1400);
    }
  };

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return newMenuItems;
    const query = searchQuery.toLowerCase().trim();
    return newMenuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [newMenuItems, searchQuery]);

  // Framer motion sliding variants for carousel
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: '0%',
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  return (
    <div className="relative w-full bg-white min-h-screen pb-12 sm:pb-16 font-sans text-neutral-900">
      {/* Top Anchor for instant & smooth scroll-to-top */}
      <div id="new-menu-top-anchor" className="absolute top-0 left-0 w-full h-0 pointer-events-none -z-10" />

      {/* Back to Main Menu Breadcrumb Bar */}
      <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-3 sm:px-4 pt-2 sm:pt-3">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs group"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform text-[#D81A07]" />
          <span>Back to Main Menu</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 1. HERO CAROUSEL BANNER (STRICT 3:1 FIXED ASPECT RATIO)      */}
      {/* ============================================================ */}
      <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-3 sm:px-4 pt-2 sm:pt-2.5 pb-2.5 sm:pb-3.5">
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{ aspectRatio: '3 / 1' }}
          className="relative w-full aspect-[3/1] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm select-none bg-neutral-950 cursor-default"
        >
          {/* Sliding Banner Background */}
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentBanner}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={normalizeImageUrl(banners[currentBanner].image)}
                alt={banners[currentBanner].alt}
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </AnimatePresence>

          {/* Gradient Vignette along bottom */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 via-black/15 to-transparent pointer-events-none z-10" />

          {/* Left Chevron */}
          <button
            onClick={handlePrevBanner}
            aria-label="Previous Slide"
            className="absolute left-2 sm:left-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/85 hover:bg-white text-neutral-800 shadow-md backdrop-blur-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer opacity-90 group-hover:opacity-100"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.8]" />
          </button>

          {/* Right Chevron */}
          <button
            onClick={handleNextBanner}
            aria-label="Next Slide"
            className="absolute right-2 sm:right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/85 hover:bg-white text-neutral-800 shadow-md backdrop-blur-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer opacity-90 group-hover:opacity-100"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.8]" />
          </button>

          {/* Pagination Indicators */}
          <div
            className="absolute bottom-2 sm:bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 bg-black/30 backdrop-blur-xs px-2.5 py-1.5 rounded-full"
            onClick={(e) => e.stopPropagation()}
          >
            {banners.map((banner, idx) => (
              <button
                key={banner.id}
                onClick={() => {
                  setDirection(idx > currentBanner ? 1 : -1);
                  setCurrentBanner(idx);
                }}
                aria-label={`Jump to banner ${idx + 1}`}
                className={`transition-all duration-300 cursor-pointer rounded-full ${
                  currentBanner === idx
                    ? 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white shadow-xs scale-110'
                    : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. STICKY CATEGORY NAVIGATION BAR POPULATED EXCLUSIVELY WITH  */}
      {/*    NEW CATEGORIES (#D81A07 BG & EXACT PILL STYLING)          */}
      {/* ============================================================ */}
      <div
        ref={categoryNavBarRef}
        className="sticky top-0 z-30 w-full bg-[#D81A07] shadow-sm shadow-red-950/20 border-b border-red-700/30 select-none will-change-transform transform-gpu"
      >
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto py-2 sm:py-2.5 px-2.5 sm:px-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Leftmost: Menu Filter Button */}
            <button
              onClick={() => setIsCategorySheetOpen(true)}
              title="All New Categories"
              aria-label="All Categories Menu"
              className="w-8.5 h-8 sm:w-10 sm:h-9 rounded-xl bg-black/20 hover:bg-black/30 border border-white/10 flex items-center justify-center text-[#FFD000] shadow-none transition-all active:scale-95 shrink-0 cursor-pointer focus:outline-none"
            >
              <Menu className="w-4 h-4 stroke-[2.6]" />
            </button>

            {/* Left Scroll Arrow Button */}
            <AnimatePresence initial={false}>
              {canScrollLeft && (
                <motion.button
                  key="cat-scroll-left"
                  initial={{ opacity: 0, scale: 0.8, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: 'auto' }}
                  exit={{ opacity: 0, scale: 0.8, width: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  onClick={scrollCategoriesLeft}
                  title="Scroll categories left"
                  aria-label="Scroll left"
                  className="hidden sm:flex w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFD000] hover:bg-[#ffe04d] items-center justify-center text-[#D81A07] shadow-xs shrink-0 cursor-pointer transition-transform active:scale-95 overflow-hidden"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Scrollable Category Tabs populated EXCLUSIVELY with new categories */}
            <div className="relative flex-1 min-w-0 flex items-center overflow-hidden py-0.5">
              {canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-5 bg-gradient-to-r from-[#D81A07] to-transparent pointer-events-none z-10" />
              )}

              <div
                ref={categoryScrollRef}
                onScroll={checkCategoryScrollBounds}
                onTouchMove={checkCategoryScrollBounds}
                onWheel={handleCategoryWheel}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className="w-full flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.5 text-xs sm:text-sm font-bold tracking-tight scroll-smooth select-none cursor-grab active:cursor-grabbing overscroll-x-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {CHILL_PILL_CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      data-category={cat}
                      onClick={(e) => {
                        if (hasMovedRef.current) {
                          e.preventDefault();
                          return;
                        }
                        handleCategoryClick(cat);
                      }}
                      className={`whitespace-nowrap transition-all duration-200 cursor-pointer px-3 sm:px-3.5 py-1.5 rounded-full select-none outline-none focus:outline-none focus:ring-0 active:ring-0 no-underline shrink-0 ${
                        isActive
                          ? 'bg-[#FFAE00] text-[#D81A07] font-black shadow-xs active:scale-95'
                          : 'text-[#FFE082] hover:text-white hover:bg-white/10 font-bold'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-5 bg-gradient-to-l from-[#D81A07] to-transparent pointer-events-none z-10" />
              )}
            </div>

            {/* Right Scroll Arrow Button */}
            <AnimatePresence initial={false}>
              {canScrollRight && (
                <motion.button
                  key="cat-scroll-right"
                  initial={{ opacity: 0, scale: 0.8, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: 'auto' }}
                  exit={{ opacity: 0, scale: 0.8, width: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  onClick={scrollCategoriesRight}
                  title="Scroll categories right"
                  aria-label="Scroll right"
                  className="hidden sm:flex w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFD000] hover:bg-[#ffe04d] items-center justify-center text-[#D81A07] shadow-xs shrink-0 cursor-pointer transition-transform active:scale-95 overflow-hidden"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. STICKY 'HOME DELIVERY COMING SOON' ANNOUNCEMENT BAR       */}
      {/* ============================================================ */}
      <div
        style={{ top: `${categoryBarHeight}px` }}
        className="sticky z-20 w-full bg-[#D81A07] shadow-sm shadow-red-950/20 border-b border-red-700/30 select-none will-change-transform transform-gpu"
      >
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto py-2 sm:py-2.5 px-3 sm:px-4 min-h-[48px] sm:min-h-[56px] flex items-center justify-center text-center">
          <span className="text-[#FFFF00] font-black text-sm sm:text-base md:text-[17px] tracking-wide uppercase sm:tracking-wider">
            Home Delivery Coming Soon
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. MAIN CONTENT & SEARCH                                     */}
      {/* ============================================================ */}
      <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        {/* Modern Search Bar */}
        <div ref={searchContainerRef} className="mb-6 sm:mb-8">
          <div
            className={`relative flex items-center w-full bg-neutral-100 rounded-2xl border transition-all ${
              isSearchHighlighted
                ? 'border-[#D81A07] ring-4 ring-[#D81A07]/20 shadow-md'
                : 'border-neutral-200/90 focus-within:border-[#D81A07] focus-within:ring-2 focus-within:ring-[#D81A07]/15'
            }`}
          >
            <Search className="w-5 h-5 text-neutral-400 ml-4 shrink-0 stroke-[2.2]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              placeholder={isSearchFocused ? 'Search new menu...' : typewriterText || 'Search new menu...'}
              className="w-full py-3 sm:py-3.5 pl-3 pr-10 text-sm sm:text-base font-medium text-neutral-900 bg-transparent outline-none placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 p-1 rounded-full text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div ref={productsGridRef} className="space-y-8 sm:space-y-10">
          {searchQuery ? (
            /* Search Results */
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-black text-neutral-900">
                  Search Results for &ldquo;{searchQuery}&rdquo; ({filteredItems.length})
                </h2>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs sm:text-sm font-bold text-[#D81A07] hover:underline cursor-pointer"
                >
                  Clear Search
                </button>
              </div>

              {filteredItems.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <p className="text-base font-bold text-neutral-700">No matching items found</p>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                    Try searching for iced coffee, boba tea, frappe, or smoothie.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-4 lg:gap-5">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      className="w-full bg-white rounded-2xl md:rounded-3xl p-3.5 sm:p-4 border border-neutral-100/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 sm:gap-4 cursor-pointer group select-none relative"
                    >
                      <div className="flex-1 min-w-0 pr-1 flex flex-col justify-between self-stretch py-0.5">
                        <div>
                          <h3 className="font-extrabold text-sm sm:text-base md:text-[17px] text-neutral-900 group-hover:text-[#D81A07] transition-colors leading-snug">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-xs sm:text-[13px] text-neutral-500 font-medium leading-relaxed mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2 sm:gap-2.5 mt-2.5 pt-0.5">
                          <span className="text-sm sm:text-base md:text-[17px] font-black text-neutral-950 tracking-tight">
                            Rs. {item.price.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl md:rounded-3xl overflow-hidden shrink-0 bg-[#FFAE00] flex items-center justify-center self-center shadow-2xs">
                        <img
                          src={normalizeImageUrl(item.image)}
                          alt={item.name}
                          onError={handleImageError}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                          loading="lazy"
                        />

                        {/* Popular Badge: Exact same size, positioning and visual style as previous discount badges */}
                        {popularBadgeItemIds.has(item.id) && (
                          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md bg-[#FFC700] text-black font-black text-[10px] sm:text-[11px] tracking-tight select-none shadow-xs">
                            Popular
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(item);
                          }}
                          title="Add to order"
                          aria-label={`Add ${item.name} to order`}
                          className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFAE00] hover:bg-[#ffbe26] active:scale-90 text-neutral-950 flex items-center justify-center font-black shadow-xs transition-all cursor-pointer z-10"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Categorized Sections Populated Exclusively with New Categories */
            CHILL_PILL_CATEGORIES.map((cat) => {
              const catItems = newMenuItems.filter((item) => item.category === cat);
              if (catItems.length === 0) return null;
              const slug = cat.toLowerCase().replace(/\s+/g, '-');

              return (
                <div
                  key={cat}
                  id={`cat-section-${slug}`}
                  className="scroll-mt-28 space-y-3 sm:space-y-4"
                >
                  {/* Category Separator Banner */}
                  {CHILL_PILL_BANNERS[cat] && (
                    <div className="w-full overflow-hidden">
                      <img
                        src={CHILL_PILL_BANNERS[cat]}
                        alt={`${cat} Banner`}
                        className="w-full h-auto max-h-[140px] sm:max-h-[185px] md:max-h-[210px] object-contain select-none filter drop-shadow-xs"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Items under this category in 2-column layout on desktop, 1-column on mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-4 lg:gap-5">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onSelectItem(item)}
                        className="w-full bg-white rounded-2xl md:rounded-3xl p-3.5 sm:p-4 border border-neutral-100/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 sm:gap-4 cursor-pointer group select-none relative"
                      >
                        {/* Left: Item Name, Description & Selling Price */}
                        <div className="flex-1 min-w-0 pr-1 flex flex-col justify-between self-stretch py-0.5">
                          <div>
                            <h3 className="font-extrabold text-sm sm:text-base md:text-[17px] text-neutral-900 group-hover:text-[#D81A07] transition-colors leading-snug">
                              {item.name}
                            </h3>
                            {item.description && (
                              <p className="text-xs sm:text-[13px] text-neutral-500 font-medium leading-relaxed mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-baseline gap-2 sm:gap-2.5 mt-2.5 pt-0.5">
                            <span className="text-sm sm:text-base md:text-[17px] font-black text-neutral-950 tracking-tight">
                              Rs. {item.price.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Right: Food Image with Yellow background */}
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl md:rounded-3xl overflow-hidden shrink-0 bg-[#FFAE00] flex items-center justify-center self-center shadow-2xs">
                          <img
                            src={normalizeImageUrl(item.image)}
                            alt={item.name}
                            onError={handleImageError}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />

                          {/* Popular Badge: Exact same size, positioning and visual style as previous discount badges */}
                          {popularBadgeItemIds.has(item.id) && (
                            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md bg-[#FFC700] text-black font-black text-[10px] sm:text-[11px] tracking-tight select-none shadow-xs">
                              Popular
                            </span>
                          )}

                          {/* Circular Plus Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(item);
                            }}
                            title="Add to order"
                            aria-label={`Add ${item.name} to order`}
                            className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFAE00] hover:bg-[#ffbe26] active:scale-90 text-neutral-950 flex items-center justify-center font-black shadow-xs transition-all cursor-pointer z-10"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. FLOATING WHATSAPP CHAT / INSTANT ORDER WIDGET            */}
      {/* ============================================================ */}
      <a
        href="https://wa.me/923200089000?text=Hi%20Tendoz!%20I%20would%20like%20to%20order%20from%20the%20Chill%20Pill%20menu."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Order via WhatsApp: 03200089000"
        title="Order via WhatsApp (03200089000)"
        className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-40 w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white flex items-center justify-center transition-colors duration-200 cursor-pointer select-none"
      >
        <svg
          viewBox="0 0 448 512"
          className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 fill-white"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
        </svg>
      </a>

      {/* ============================================================ */}
      {/* 6. SCROLL-TRIGGERED FLOATING ACTION BUTTONS (SEARCH & TOP)    */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showFloatingButtons && (
          <>
            {/* Left Floating Action Button: Search */}
            <motion.button
              key="floating-search-btn"
              type="button"
              initial={{ opacity: 0, scale: 0.85, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 14 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={handleSearchClick}
              aria-label="Search Menu"
              title="Search Menu"
              className="fixed bottom-5 left-4 sm:bottom-6 sm:left-6 z-40 w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white flex items-center justify-center shadow-md cursor-pointer select-none touch-manipulation"
            >
              <Search className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
            </motion.button>

            {/* Right Floating Action Button: Scroll to Top */}
            <motion.button
              key="floating-top-btn"
              type="button"
              initial={{ opacity: 0, scale: 0.85, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 14 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={handleScrollToTop}
              aria-label="Scroll to Top"
              title="Scroll to Top"
              className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white flex items-center justify-center shadow-md cursor-pointer select-none touch-manipulation"
            >
              <svg
                className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* 7. ALL CATEGORIES DRAWER SHEET (POPULATED WITH NEW CATEGORIES) */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isCategorySheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategorySheetOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[82vh] overflow-hidden flex flex-col z-10 shadow-2xl"
            >
              {/* Sheet Header */}
              <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <div>
                  <h3 className="font-extrabold text-lg text-neutral-900">
                    Chill Pill Categories
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium">
                    Select a category to jump directly
                  </p>
                </div>
                <button
                  onClick={() => setIsCategorySheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-200/70 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Category List */}
              <div className="p-3 sm:p-4 overflow-y-auto space-y-1.5 divide-y divide-neutral-50">
                {CHILL_PILL_CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat;
                  const count = newMenuItems.filter((i) => i.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryClick(cat)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#D81A07] text-white font-black shadow-xs'
                          : 'hover:bg-neutral-100 text-neutral-800 font-semibold'
                      }`}
                    >
                      <span className="text-sm">{cat}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-neutral-200/60 text-neutral-600'
                        }`}
                      >
                        {count} items
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sheet Footer */}
              <div className="p-3 sm:p-4 border-t border-neutral-100 bg-neutral-50">
                <button
                  onClick={() => {
                    setIsCategorySheetOpen(false);
                    onNavigate('home');
                  }}
                  className="w-full py-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5] text-[#D81A07]" />
                  <span>Return to Main Food Menu</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
