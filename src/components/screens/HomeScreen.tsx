import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Menu, ArrowRight, Plus, X, Search, Heart } from 'lucide-react';
import { MenuItem, ScreenName, Order } from '../../types';
import {
  carouselBanner1Img,
  carouselBanner2Img,
  carouselBanner3Img,
  CATEGORY_BANNERS,
  CATEGORY_LIST,
  CHILL_PILL_CATEGORIES,
} from '../../data/initialData';
import { motion, AnimatePresence } from 'motion/react';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import {
  getBurgerSubcategories,
  getPizzaSubcategories,
  resolvePopularBadgeItemIds,
} from '../../utils/popularBadgeUtils';
import { ActiveOrderCard } from '../ActiveOrderCard';

interface HomeScreenProps {
  items: MenuItem[];
  wishlistIds: string[];
  onToggleWishlist: (itemId: string) => void;
  onSelectItem: (item: MenuItem) => void;
  onOrderNow: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem) => void;
  cartCount?: number;
  onOpenCart?: () => void;
  onNavigate?: (screen: ScreenName) => void;
  activeOrder?: Order | null;
  onOpenOrderTracking?: () => void;
  onCancelOrder?: (orderId: string) => Promise<void> | void;
  onDismissActiveOrder?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  items,
  wishlistIds,
  onToggleWishlist,
  onSelectItem,
  onOrderNow: _onOrderNow,
  onAddToCart,
  cartCount: _cartCount = 0,
  onOpenCart: _onOpenCart,
  onNavigate,
  activeOrder,
  onOpenOrderTracking,
  onCancelOrder,
  onDismissActiveOrder,
}) => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [direction, setDirection] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('Popular');
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

  // Monitor sticky category navigation bar height so sticky announcement bar docks pixel-perfectly
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

  const productsGridRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Lag-free hardware-accelerated smooth scrolling across all devices
  const smoothScrollTo = (targetY: number) => {
    try {
      window.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });
    } catch {
      window.scrollTo(0, targetY);
    }
  };

  // Scroll to the very top with instant click response and silky smooth transition
  const handleScrollToTop = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    smoothScrollTo(0);
  };

  // Scroll smoothly directly to the top search bar and focus the input field with zero lag
  const handleSearchClick = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Calculate exact target position so search bar lands clearly in view under sticky headers
    let targetY = 230;
    const searchEl = searchContainerRef.current || searchInputRef.current;
    if (searchEl) {
      const rect = searchEl.getBoundingClientRect();
      const currentScroll =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        0;
      // 60px leaves comfortable spacing below sticky Category bar (~48px)
      targetY = Math.max(0, Math.round(currentScroll + rect.top - 60));
    }

    // 1. Instant lag-free smooth scroll
    smoothScrollTo(targetY);

    // 2. Immediate visual highlight on search bar
    setIsSearchHighlighted(true);

    // 3. Immediate focus on input field (with preventScroll: true so it doesn't jump or disrupt smooth scroll)
    if (searchInputRef.current) {
      try {
        searchInputRef.current.focus({ preventScroll: true });
      } catch {
        searchInputRef.current.focus();
      }
    }

    // 4. Re-focus and select text once smooth scroll finishes for effortless typing
    setTimeout(() => {
      if (searchInputRef.current) {
        try {
          searchInputRef.current.focus({ preventScroll: true });
          searchInputRef.current.select();
        } catch {
          searchInputRef.current.focus();
        }
      }
    }, 380);

    setTimeout(() => {
      setIsSearchHighlighted(false);
    }, 2200);
  };

  // Monitor scroll to smoothly reveal action icons when reaching Products Grid
  // and smoothly hide them when scrolling back to the very top of the page
  useEffect(() => {
    const handleScroll = () => {
      const scrollY =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      // Hide completely when near top
      if (scrollY < 120) {
        setShowFloatingButtons(false);
        return;
      }

      if (productsGridRef.current) {
        const rect = productsGridRef.current.getBoundingClientRect();
        // Appear when user reaches Products Grid section
        const isReached = rect.top <= window.innerHeight * 0.85;
        setShowFloatingButtons(isReached);
      } else {
        setShowFloatingButtons(scrollY > 200);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Exact 3:1 commercial banners matching reference image styling
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

  // Top sticky horizontal category bar: strictly original categories (never includes new categories)
  const categories = CATEGORY_LIST;

  // Subcategory Popular Badge Distribution: Guaranteed at least one per subcategory + admin database persistence
  const popularBadgeItemIds = useMemo(() => {
    return resolvePopularBadgeItemIds(items);
  }, [items]);

  const isChillPillCategoryOrItem = useCallback((catName?: string, item?: MenuItem) => {
    const cat = catName || item?.category || '';
    return CHILL_PILL_CATEGORIES.includes(cat as any);
  }, []);

  // All menu sections to display down below: original categories + newly added categories
  const allSectionCategories = useMemo(() => {
    const extraCategories: string[] = [];
    items.forEach((item) => {
      if (
        item.category &&
        !CATEGORY_LIST.includes(item.category as any) &&
        !extraCategories.includes(item.category)
      ) {
        extraCategories.push(item.category);
      }
    });
    return [
      ...CATEGORY_LIST.filter((cat) => cat !== 'Popular'),
      ...extraCategories,
    ];
  }, [items]);

  // Separate sections: Original categories vs. newly added categories for the announcement bar
  const originalSectionCategories = useMemo(
    () => allSectionCategories.filter((cat) => !isChillPillCategoryOrItem(cat)),
    [allSectionCategories, isChillPillCategoryOrItem]
  );

  const newSectionCategories = useMemo(
    () => allSectionCategories.filter((cat) => isChillPillCategoryOrItem(cat)),
    [allSectionCategories, isChillPillCategoryOrItem]
  );

  // Dynamic Typewriter category strings for animated search placeholder with ellipsis (...)
  const typewriterStrings = useMemo(
    () => [
      'Search pizza...',
      'Search burger...',
      'Search deals...',
      'Search injected broast...',
      'Search fried chicken...',
      'Search wraps...',
      'Search appetizers...',
      'Search pastas...',
      'Search flavoured soda...',
      'Search soft drinks...',
    ],
    []
  );

  // Smooth typewriter animation: types out character-by-character, pauses, then deletes before typing next
  useEffect(() => {
    if (isSearchFocused) return;

    const currentTarget = typewriterStrings[currentCategoryIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      // Natural moderate typing speed: 85ms per character
      if (typewriterText.length < currentTarget.length) {
        timer = setTimeout(() => {
          setTypewriterText(currentTarget.slice(0, typewriterText.length + 1));
        }, 85);
      } else {
        // Full string typed out: pause briefly (1800ms) so user can comfortably read it
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 1800);
      }
    } else {
      // Natural moderate deleting/backspacing speed: 45ms per character
      if (typewriterText.length > 0) {
        timer = setTimeout(() => {
          setTypewriterText(currentTarget.slice(0, typewriterText.length - 1));
        }, 45);
      } else {
        // Fully backspaced/deleted: brief pause (350ms) before typing next category
        timer = setTimeout(() => {
          setIsDeleting(false);
          setCurrentCategoryIndex((prev) => (prev + 1) % typewriterStrings.length);
        }, 350);
      }
    }

    return () => clearTimeout(timer);
  }, [typewriterText, isDeleting, currentCategoryIndex, isSearchFocused, typewriterStrings]);

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    // If user clicks away (blurs) without typing a query, restart the typewriter animation loop naturally
    if (!searchQuery.trim()) {
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
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, banners.length]);

  // Check horizontal scroll limits for conditional arrows
  const checkCategoryScrollBounds = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  }, []);

  // Update bounds on mount, resize, and category updates
  useEffect(() => {
    checkCategoryScrollBounds();
    const handleResize = () => checkCategoryScrollBounds();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkCategoryScrollBounds]);

  // Smoothly center the active category pill in the horizontal bar whenever activeCategory changes
  const centerCategoryPill = useCallback(
    (cat: string, behavior: ScrollBehavior = 'smooth') => {
      const el = categoryScrollRef.current;
      if (!el) return;

      const activeBtn = el.querySelector<HTMLButtonElement>(`[data-category="${cat}"]`);
      if (activeBtn) {
        const containerWidth = el.clientWidth;
        const btnOffsetLeft = activeBtn.offsetLeft;
        const btnWidth = activeBtn.clientWidth;
        const targetScrollLeft = btnOffsetLeft - containerWidth / 2 + btnWidth / 2;

        el.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior,
        });
        setTimeout(checkCategoryScrollBounds, 320);
      }
    },
    [checkCategoryScrollBounds]
  );

  // Automatically slide the category bar horizontally whenever activeCategory changes (from scroll or click)
  useEffect(() => {
    centerCategoryPill(activeCategory, 'smooth');
  }, [activeCategory, centerCategoryPill]);

  // Release drag if mouseup happens anywhere in window
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        if (categoryScrollRef.current) {
          categoryScrollRef.current.style.scrollBehavior = 'smooth';
          checkCategoryScrollBounds();
        }
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [checkCategoryScrollBounds]);

  const handleNextBanner = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(1);
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const handlePrevBanner = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(-1);
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Smooth slide by clicking horizontal arrow buttons
  const scrollCategories = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
      setTimeout(checkCategoryScrollBounds, 250);
    }
  };

  const scrollCategoriesLeft = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
      setTimeout(checkCategoryScrollBounds, 250);
    }
  };

  // Horizontal mouse wheel sliding
  const handleCategoryWheel = (e: React.WheelEvent) => {
    if (!categoryScrollRef.current) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      // Natural horizontal trackpad scroll
      return;
    }
    // Vertical mouse wheel over category bar -> smooth horizontal slide
    e.preventDefault();
    categoryScrollRef.current.scrollBy({
      left: e.deltaY * 1.5,
      behavior: 'smooth',
    });
    setTimeout(checkCategoryScrollBounds, 120);
  };

  // Mouse drag to smoothly slide categories horizontally on desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoryScrollRef.current) return;
    isMouseDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - categoryScrollRef.current.offsetLeft;
    scrollLeftStartRef.current = categoryScrollRef.current.scrollLeft;
    categoryScrollRef.current.style.scrollBehavior = 'auto';
  };

  const handleMouseLeave = () => {
    if (isMouseDownRef.current && categoryScrollRef.current) {
      isMouseDownRef.current = false;
      categoryScrollRef.current.style.scrollBehavior = 'smooth';
      setTimeout(checkCategoryScrollBounds, 60);
    }
  };

  const handleMouseUp = () => {
    if (isMouseDownRef.current && categoryScrollRef.current) {
      isMouseDownRef.current = false;
      categoryScrollRef.current.style.scrollBehavior = 'smooth';
      setTimeout(checkCategoryScrollBounds, 60);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !categoryScrollRef.current) return;
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.35;
    if (Math.abs(walk) > 3) {
      hasMovedRef.current = true;
      categoryScrollRef.current.scrollLeft = scrollLeftStartRef.current - walk;
      checkCategoryScrollBounds();
    }
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    if (searchQuery.trim()) {
      setSearchQuery('');
    }

    // Lock programmatic scroll to prevent scrollspy jitter while page scrolls to section
    isProgrammaticScrollRef.current = true;
    if (programmaticScrollTimerRef.current) {
      clearTimeout(programmaticScrollTimerRef.current);
    }
    programmaticScrollTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 850);

    // Smoothly slide category pill to center
    centerCategoryPill(cat, 'smooth');

    const slug = cat.toLowerCase().replace(/\s+/g, '-');
    const el = document.getElementById(`cat-section-${slug}`);
    if (el) {
      const rect = el.getBoundingClientRect();
      const currentScroll = window.scrollY || window.pageYOffset || 0;
      const targetY = Math.max(0, Math.round(currentScroll + rect.top - 52));
      smoothScrollTo(targetY);
    }
  };

  // Scroll spy to highlight active category in the sticky bar as user scrolls down
  useEffect(() => {
    let ticking = false;

    const handleScrollSpy = () => {
      if (isProgrammaticScrollRef.current) return;
      if (searchQuery.trim()) return;

      const scrollY = window.scrollY || window.pageYOffset || 0;

      // When near top of the page, default to 'Popular'
      if (scrollY < 180) {
        setActiveCategory('Popular');
        return;
      }

      // If scrolled to the bottom of the page, highlight the last category available
      const isAtBottom =
        window.innerHeight + scrollY >= document.documentElement.scrollHeight - 50;
      if (isAtBottom) {
        const lastCategory = [...categories].reverse().find((cat) => {
          const slug = cat.toLowerCase().replace(/\s+/g, '-');
          return !!document.getElementById(`cat-section-${slug}`);
        });
        if (lastCategory) {
          setActiveCategory(lastCategory);
          return;
        }
      }

      // Check section bounding client rects relative to sticky bar
      // Category bar is sticky at top-0, height ~48px.
      // A section is active when its top is within viewport just below category bar
      const threshold = 110;
      let matchedCategory = 'Popular';

      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        const slug = cat.toLowerCase().replace(/\s+/g, '-');
        const el = document.getElementById(`cat-section-${slug}`);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if (rect.top <= threshold && rect.bottom > threshold) {
          matchedCategory = cat;
          break;
        } else if (rect.top <= threshold) {
          matchedCategory = cat;
        }
      }

      setActiveCategory(matchedCategory);
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScrollSpy();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [searchQuery, categories]);

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Popular Items Showcase Grid: Includes the 3 specific products (Pocket Pizza, Sando, Zingo Tringo) and popular favorites
  const topFeaturedItems = useMemo(() => {
    const pocketPizza =
      items.find((i) => i.id === 'pocket-pizza') ||
      items.find((i) => i.name.toLowerCase() === 'pocket pizza');

    const sando =
      items.find((i) => i.id === 'sando') ||
      items.find((i) => i.name.toLowerCase() === 'sando');

    const zingoTringo =
      items.find((i) => i.id === 'zingo-tringo') ||
      items.find((i) => i.name.toLowerCase().includes('zingo tringo'));

    const featuredDeal =
      items.find((i) => i.id === 'zingo-deal') ||
      items.find((i) => i.id === 'twin-pizza-treat') ||
      items.find((i) => i.category === 'Deals' && i.isPopular) ||
      items.find((i) => i.category === 'Deals');

    const pizza =
      items.find((i) => i.id === 'chicken-tikka-pizza') ||
      items.find((i) => (i.category === 'Pizzas' || i.category === 'Pizza') && i.isPopular) ||
      items.find((i) => i.category === 'Pizzas' || i.category === 'Pizza');

    const zingerBurger =
      items.find((i) => i.id === 'zingo-burger' || i.id === 'zinger-burger') ||
      items.find((i) => i.category === 'Burgers' && (i.name.toLowerCase().includes('zinger') || i.name.toLowerCase().includes('zingo'))) ||
      items.find((i) => i.category === 'Burgers');

    const injectedBroast =
      items.find((i) => i.id === 'injected-broast-quarter') ||
      items.find((i) => i.category === 'Injected Broast' && i.isPopular) ||
      items.find((i) => i.category === 'Injected Broast');

    const wrap =
      items.find((i) => i.id === 'crispy-and-crunchy-wrap' || i.id === 'crispy-crunchy-wrap') ||
      items.find((i) => i.category === 'Wraps' && i.isPopular) ||
      items.find((i) => i.category === 'Wraps');

    return [
      pocketPizza,
      sando,
      zingoTringo,
      featuredDeal,
      pizza,
      zingerBurger,
      injectedBroast,
      wrap,
    ].filter(Boolean) as MenuItem[];
  }, [items]);

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
      <div id="home-top-anchor" className="absolute top-0 left-0 w-full h-0 pointer-events-none -z-10" />

      {/* ============================================================ */}
      {/* 1. HERO CAROUSEL BANNER (STRICT 3:1 FIXED ASPECT RATIO)      */}
      {/* ============================================================ */}
      <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-3 sm:px-4 pt-2.5 sm:pt-3.5 pb-2.5 sm:pb-3.5">
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{ aspectRatio: '3 / 1' }}
          className="relative w-full aspect-[3/1] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm select-none bg-neutral-950 cursor-default"
        >
          {/* Sliding Banner Background & Food Art */}
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
                loading="eager"
                fetchPriority="high"
              />
            </motion.div>
          </AnimatePresence>

          {/* Subtle Gradient Vignette along bottom for indicator readability */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 via-black/15 to-transparent pointer-events-none z-10" />

          {/* Left Chevron Navigation Button */}
          <button
            onClick={handlePrevBanner}
            aria-label="Previous Slide"
            className="absolute left-2 sm:left-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/85 hover:bg-white text-neutral-800 shadow-md backdrop-blur-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer opacity-90 group-hover:opacity-100"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.8]" />
          </button>

          {/* Right Chevron Navigation Button */}
          <button
            onClick={handleNextBanner}
            aria-label="Next Slide"
            className="absolute right-2 sm:right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/85 hover:bg-white text-neutral-800 shadow-md backdrop-blur-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer opacity-90 group-hover:opacity-100"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.8]" />
          </button>

          {/* Pagination Indicators matching reference image (clean circular dots) */}
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
      {/* 2. STICKY CATEGORY NAVIGATION BAR (#D81A07 BG & EXACT PILL STYLING) */}
      {/* ============================================================ */}
      <div 
        ref={categoryNavBarRef}
        className="sticky top-0 z-30 w-full bg-[#D81A07] shadow-sm shadow-red-950/20 border-b border-red-700/30 select-none will-change-transform transform-gpu"
      >
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto py-2 sm:py-2.5 px-2.5 sm:px-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Leftmost: Menu Filter Button */}
            <button
              onClick={() => {
                setIsCategorySheetOpen(true);
              }}
              title="All Deals / Menu Overview"
              aria-label="All Categories Menu"
              className="w-8.5 h-8 sm:w-10 sm:h-9 rounded-xl bg-black/20 hover:bg-black/30 border border-white/10 flex items-center justify-center text-[#FFD000] shadow-none transition-all active:scale-95 shrink-0 cursor-pointer focus:outline-none"
            >
              <Menu className="w-4 h-4 stroke-[2.6]" />
            </button>

            {/* Left Scroll Arrow Button (desktop / tablet) */}
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

            {/* Scrollable Category Tabs with Smooth Sliding & Exact Pill Styling */}
            <div className="relative flex-1 min-w-0 flex items-center overflow-hidden py-0.5">
              {/* Left Edge Fade */}
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
                {categories.map((cat) => {
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
                      className={`whitespace-nowrap transition-all duration-200 cursor-pointer px-3 sm:px-3.5 py-1.5 rounded-full select-none outline-none focus:outline-none focus:ring-0 active:ring-0 no-underline decoration-transparent text-decoration-none shrink-0 ${
                        isActive
                          ? 'bg-[#FFAE00] text-[#D81A07] font-black shadow-xs active:scale-95'
                          : 'text-[#FFE082] hover:text-white hover:bg-white/10 font-bold'
                      }`}
                      style={{ textDecoration: 'none' }}
                    >
                      <span style={{ textDecoration: 'none' }}>{cat}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Edge Fade */}
              {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-5 bg-gradient-to-l from-[#D81A07] to-transparent pointer-events-none z-10" />
              )}
            </div>

            {/* Right: Circular Next Arrow Button */}
            <AnimatePresence initial={false}>
              {canScrollRight && (
                <motion.button
                  key="cat-scroll-right"
                  initial={{ opacity: 0, scale: 0.8, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: 'auto' }}
                  exit={{ opacity: 0, scale: 0.8, width: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  onClick={scrollCategories}
                  title="Scroll categories right"
                  aria-label="Scroll right"
                  className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-full bg-[#FFD000] hover:bg-[#ffe04d] flex items-center justify-center text-[#D81A07] shadow-xs shrink-0 cursor-pointer transition-transform active:scale-95 overflow-hidden"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-3.5 sm:space-y-4">
        {/* ============================================================ */}
        {/* 3. CAPSULE SEARCH BAR                                        */}
        {/* ============================================================ */}
        <div ref={searchContainerRef} className="px-3 sm:px-4 pt-3.5 sm:pt-4 transition-all duration-300">
          <div className="relative w-full max-w-2xl mx-auto">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onClick={handleSearchFocus}
              onBlur={handleSearchBlur}
              placeholder={isSearchFocused ? '' : typewriterText}
              className={`w-full bg-white text-neutral-900 placeholder:text-neutral-700 placeholder:font-semibold placeholder:opacity-100 text-xs sm:text-sm pl-6 pr-20 py-3 sm:py-3.5 rounded-full border shadow-xs focus:outline-none transition-colors duration-200 ${
                isSearchHighlighted
                  ? 'border-[#D81A07] ring-4 ring-[#D81A07]/25 bg-red-50/20'
                  : 'border-neutral-200 focus:border-[#D81A07] focus:ring-2 focus:ring-[#D81A07]/20'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-neutral-400 hover:text-neutral-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Secondary Color (#FFAE00) Circular Action Button with Arrow */}
            <button
              onClick={() => {
                if (!searchQuery.trim()) {
                  searchInputRef.current?.focus();
                }
              }}
              title="Search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFAE00] hover:bg-[#e09900] text-neutral-950 flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 stroke-[2.8]" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ACTIVE ORDER STATUS TRACKING TAB/CARD (Reference Image 2)    */}
        {/* ============================================================ */}
        {activeOrder && (
          <div className="px-3 sm:px-4 pt-1">
            <ActiveOrderCard
              order={activeOrder}
              onViewDetails={onOpenOrderTracking || (() => {})}
              onCancelOrder={onCancelOrder}
              onDismiss={onDismissActiveOrder}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. CATEGORIZED MENU SECTIONS & POPULAR PRODUCTS              */}
        {/* ============================================================ */}
        <div ref={productsGridRef} className="px-3 sm:px-4 pt-2 sm:pt-3 space-y-6 sm:space-y-8">
          {searchQuery.trim() ? (
            /* Search Results View */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-neutral-950">
                    Search Results for "{searchQuery}"
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Found {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-[#D81A07] hover:underline cursor-pointer"
                >
                  Clear Search
                </button>
              </div>

              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-neutral-500">
                  <p className="font-semibold text-base">No items found matching your search</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-3 px-4 py-2 bg-[#D81A07] hover:bg-[#b81505] text-white rounded-full font-bold text-xs cursor-pointer shadow-sm"
                  >
                    View Full Menu
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-4 lg:gap-5">
                  {filteredItems.map((item) => {
                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectItem(item)}
                        className="w-full bg-white rounded-2xl md:rounded-3xl p-3.5 sm:p-4 border border-neutral-100/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 sm:gap-4 cursor-pointer group select-none"
                      >
                        {/* Left: Item Name, Description & Clean Price */}
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

                          {/* Clean Original Price */}
                          <div className="flex items-baseline gap-2 mt-2.5 pt-0.5">
                            <span className="text-sm sm:text-base md:text-[17px] font-black text-neutral-950 tracking-tight">
                              Rs. {item.price.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Right: Enlarged Food Image Container with Yellow background & Popular Badge */}
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

                          {/* Yellow Plus Button at bottom-right of image */}
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
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Categorized Full Menu View */
            <div className="space-y-6 sm:space-y-8">
              {/* 1. Dedicated POPULAR PRODUCTS Section near top (Top 5 Featured Showcase Items) */}
              <div
                id="cat-section-popular"
                className="scroll-mt-20 space-y-3.5 sm:space-y-4"
              >
                {/* Popular Items Header matching reference screenshot */}
                <div className="pt-0.5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
                      Popular Items
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
                      Most ordered right now
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const allDeals = document.getElementById('cat-section-all');
                      if (allDeals) allDeals.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1 text-xs sm:text-sm font-bold text-neutral-900 hover:text-[#D81A07] transition-colors cursor-pointer select-none"
                  >
                    <span>See all</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Popular Showcase Items: 4 columns on desktop matching reference image, 2 columns on mobile */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-4 lg:gap-5">
                  {topFeaturedItems.map((item) => {
                    const isWishlisted = wishlistIds.includes(item.id);

                    return (
                      <div
                        key={`featured-${item.id}`}
                        onClick={() => onSelectItem(item)}
                        className="cursor-pointer group flex flex-col select-none w-full"
                      >
                        {/* Structured Box-Shaped Image Container (No card border around outer card) */}
                        <div className="relative w-full aspect-square rounded-[22px] sm:rounded-3xl overflow-hidden bg-[#FFAE00] shadow-xs flex items-center justify-center">
                          {/* Centered framed product image */}
                          <img
                            src={normalizeImageUrl(item.image)}
                            alt={item.name}
                            onError={handleImageError}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                            referrerPolicy="no-referrer"
                            loading="eager"
                            fetchPriority="high"
                          />

                          {/* Top-Left: Rounded Favorite Heart Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWishlist(item.id);
                            }}
                            title={isWishlisted ? 'Remove from favorites' : 'Save to favorites'}
                            aria-label={isWishlisted ? 'Remove from favorites' : 'Save to favorites'}
                            className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/35 hover:bg-black/50 backdrop-blur-xs flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer z-10 shadow-xs"
                          >
                            <Heart
                              className={`w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] transition-colors ${
                                isWishlisted
                                  ? 'fill-[#D81A07] text-[#D81A07]'
                                  : 'text-white'
                              }`}
                            />
                          </button>

                          {/* Bottom-Right: Circular Plus Button matching reference screenshot */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(item);
                            }}
                            title="Add to food bag"
                            aria-label={`Add ${item.name} to food bag`}
                            className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFAE00] hover:bg-[#ffbe26] active:scale-90 text-neutral-950 shadow-xs flex items-center justify-center cursor-pointer transition-all shrink-0 z-10 border border-white/40"
                          >
                            <Plus className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[3] text-neutral-950" />
                          </button>
                        </div>

                        {/* Title & Price below image container: Clean typography directly on surface */}
                        <div className="pt-2 sm:pt-2.5 px-0.5 flex flex-col">
                          <h3 className="font-extrabold text-[15px] sm:text-base text-neutral-950 leading-snug line-clamp-1 group-hover:text-[#D81A07] transition-colors">
                            {item.name}
                          </h3>

                          {/* Clean Original Price */}
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="font-extrabold text-[15px] sm:text-base text-neutral-950">
                              Rs. {item.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category-wise layout rendering helper */}
              {(() => {
                const renderItemCard = (item: MenuItem, cat: string) => {
                  const isStage2PriorityCategory = ['Popular', 'Pizzas', 'Burgers', 'Deals'].includes(cat);

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      className="w-full bg-white rounded-2xl md:rounded-3xl p-3.5 sm:p-4 border border-neutral-100/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 sm:gap-4 cursor-pointer group select-none relative"
                    >
                      {/* Left: Item Name, Description & Clean Price */}
                      <div className="flex-1 min-w-0 pr-1 flex flex-col justify-between self-stretch py-0.5">
                        <div>
                          {/* Item Name */}
                          <h3 className="font-extrabold text-sm sm:text-base md:text-[17px] text-neutral-900 group-hover:text-[#D81A07] transition-colors leading-snug">
                            {item.name}
                          </h3>

                          {/* Description */}
                          {item.description && (
                            <p className="text-xs sm:text-[13px] text-neutral-500 font-medium leading-relaxed mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Clean Original Price */}
                        <div className="flex items-baseline gap-2 sm:gap-2.5 mt-2.5 pt-0.5">
                          <span className="text-sm sm:text-base md:text-[17px] font-black text-neutral-950 tracking-tight">
                            Rs. {item.price.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Right: Enlarged Food Image Container with Yellow background & Popular Badge */}
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl md:rounded-3xl overflow-hidden shrink-0 bg-[#FFAE00] flex items-center justify-center self-center shadow-2xs">
                        <img
                          src={normalizeImageUrl(item.image)}
                          alt={item.name}
                          onError={handleImageError}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                          referrerPolicy="no-referrer"
                          loading={isStage2PriorityCategory ? 'eager' : 'lazy'}
                          fetchPriority={isStage2PriorityCategory ? 'high' : 'low'}
                        />

                        {/* Popular Badge: Exact same size, positioning and visual style as previous discount badges */}
                        {popularBadgeItemIds.has(item.id) && (
                          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md bg-[#FFC700] text-black font-black text-[10px] sm:text-[11px] tracking-tight select-none shadow-xs">
                            Popular
                          </span>
                        )}

                        {/* Circular Plus Button at bottom-right of image */}
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
                  );
                };

                const renderCategorySection = (cat: string) => {
                  const catItems = items.filter((item) => {
                    if (cat === 'Pizzas') {
                      return item.category === 'Pizzas' || item.category === 'Pizza';
                    }
                    if (cat === 'Pastas') {
                      return item.category === 'Pastas' || item.category === 'Pasta';
                    }
                    return item.category === cat;
                  });

                  if (catItems.length === 0) return null;
                  const slug = cat.toLowerCase().replace(/\s+/g, '-');

                  const isSubcategorized =
                    cat === 'Burgers' || cat === 'Pizzas' || cat === 'Pizza' || cat === 'Burger';
                  const subcategories = isSubcategorized
                    ? cat === 'Burgers' || cat === 'Burger'
                      ? getBurgerSubcategories(catItems)
                      : getPizzaSubcategories(catItems)
                    : [];

                  return (
                    <div
                      key={cat}
                      id={`cat-section-${slug}`}
                      className="scroll-mt-20 space-y-4 sm:space-y-6"
                    >
                      {/* Category Banner Image with transparent background */}
                      {CATEGORY_BANNERS[cat] && (
                        <div className="w-full overflow-hidden">
                          <img
                            src={CATEGORY_BANNERS[cat]}
                            alt={`${cat} Banner`}
                            className="w-full h-auto max-h-[140px] sm:max-h-[185px] md:max-h-[210px] object-contain select-none filter drop-shadow-xs"
                            loading={
                              ['Popular', 'Pizzas', 'Burgers', 'Deals'].includes(cat)
                                ? 'eager'
                                : 'lazy'
                            }
                            fetchPriority={
                              ['Popular', 'Pizzas', 'Burgers', 'Deals'].includes(cat)
                                ? 'high'
                                : 'low'
                            }
                          />
                        </div>
                      )}

                      {/* Subcategorized View (Burgers & Pizzas) */}
                      {isSubcategorized ? (
                        <div className="space-y-8 sm:space-y-10 md:space-y-12">
                          {subcategories.map((subcat) => (
                            <div key={subcat.title} className="space-y-3 sm:space-y-4">
                              {/* Text-Only Yellow Subcategory Header (Center-Aligned) */}
                              <div className="pt-2 sm:pt-3 pb-1 sm:pb-2 text-center select-none flex items-center justify-center">
                                <h3 className="font-integral text-[26px] sm:text-[34px] md:text-[40px] lg:text-[44px] font-black text-[#FFC700] tracking-tight uppercase leading-tight drop-shadow-xs">
                                  {subcat.title}
                                </h3>
                              </div>

                              {/* Subcategory Products Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-4 lg:gap-5">
                                {subcat.items.map((item) => renderItemCard(item, cat))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Standard Category Items Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-4 lg:gap-5">
                          {catItems.map((item) => renderItemCard(item, cat))}
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <>
                    {/* 2. Original Menu Categories */}
                    {originalSectionCategories.map((cat) => renderCategorySection(cat))}

                    {/* 3. New Menu Tab Section */}
                    <div id="new-menu-section" className="relative pt-3 sm:pt-4">
                      {/* Dedicated New Menu Tab Button (sized identically to a single product card container) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-4 lg:gap-5">
                        <div
                          onClick={() => {
                            if (onNavigate) {
                              onNavigate('new-menu');
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (onNavigate) onNavigate('new-menu');
                            }
                          }}
                          aria-label="Navigate to Chill Pill Special New Menu"
                          className="w-full bg-white rounded-2xl md:rounded-3xl p-3.5 sm:p-4 border border-neutral-100/90 hover:border-[#D81A07]/40 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 sm:gap-4 cursor-pointer group select-none relative"
                        >
                          {/* Left: New Menu Heading, Description, and Link */}
                          <div className="flex-1 min-w-0 pr-1 flex flex-col justify-between self-stretch py-0.5">
                            <div>
                              {/* Pill Badge */}
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FFF3D6] text-[#B87000] text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D81A07] animate-pulse" />
                                NEW MENU
                              </div>

                              {/* Title */}
                              <h3 className="font-extrabold text-sm sm:text-base md:text-[17px] text-neutral-900 group-hover:text-[#D81A07] transition-colors leading-snug">
                                Chill Pill Special Menu
                              </h3>

                              {/* Description */}
                              <p className="text-xs sm:text-[13px] text-neutral-500 font-medium leading-relaxed mt-1 line-clamp-2">
                                Explore 80+ cold coffees, frappes, nitro ice cream, boba teas, mocktails &amp; gourmet shakes.
                              </p>
                            </div>

                            {/* Action Link with Arrow */}
                            <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-extrabold text-[#D81A07] group-hover:text-[#BA1405] mt-2.5 pt-0.5 transition-colors">
                              <span>View New Menu</span>
                              <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>

                          {/* Right: Food Image Container matching exact product card dimensions with Yellow background */}
                          <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl md:rounded-3xl overflow-hidden shrink-0 bg-[#FFAE00] flex items-center justify-center self-center shadow-2xs">
                            <img
                              src={normalizeImageUrl('https://kommodo.ai/i/eLLos3b8P0BmrJn5Zl3O')}
                              alt="Chill Pill Special Menu"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                              loading="lazy"
                            />

                            {/* Circular Action Button at bottom-right of image */}
                            <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFAE00] hover:bg-[#ffbe26] group-hover:bg-[#D81A07] group-hover:text-[#FFFF00] text-neutral-950 flex items-center justify-center font-black shadow-xs transition-colors">
                              <ArrowRight className="w-4 h-4 stroke-[3]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. FLOATING WHATSAPP CHAT / INSTANT ORDER WIDGET            */}
      {/* ============================================================ */}
      <a
        href="https://wa.me/923200089000?text=Hi%20Tendoz!%20I%20would%20like%20to%20order%20food."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Order via WhatsApp: 03200089000"
        title="Order via WhatsApp (03200089000)"
        className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-40 w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white flex items-center justify-center transition-colors duration-200 cursor-pointer select-none"
      >
        {/* Scaled-down Official WhatsApp Vector Icon (no drop-shadow, perfectly centered) */}
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
            {/* Left Floating Action Button: Search (Strict squircle shape, no click effect, matching reference inner icon) */}
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
              <svg
                className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7.5" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </motion.button>

            {/* Right Floating Action Button: Scroll-to-Top (Strict squircle shape, no click effect, matching reference inner chevron) */}
            <motion.button
              key="floating-scroll-top-btn"
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
                className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 15L12 9L6 15" />
              </svg>
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* 8. CATEGORY SELECTOR MODAL (OPENED VIA TOP CATEGORY MENU)     */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isCategorySheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative border border-neutral-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#D81A07] text-white flex items-center justify-center shadow-xs">
                    <Menu className="w-4 h-4 stroke-[2.6]" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-neutral-950">Food Categories</h3>
                    <p className="text-[11px] text-neutral-500 font-medium">Quickly jump to menu sections</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCategorySheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-4">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setIsCategorySheetOpen(false);
                        handleCategoryClick(cat);
                      }}
                      className={`p-3 rounded-2xl text-left font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-[#D81A07] text-white shadow-md shadow-[#D81A07]/25'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-100'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {isActive && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Active</span>}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsCategorySheetOpen(false);
                    smoothScrollTo(0);
                  }}
                  className="text-xs font-bold text-[#D81A07] hover:underline cursor-pointer"
                >
                  View Full Menu
                </button>
                <button
                  onClick={() => {
                    setIsCategorySheetOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-900 cursor-pointer"
                >
                  Scroll To Top ↑
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
