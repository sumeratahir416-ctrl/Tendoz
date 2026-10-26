import { MenuItem } from '../types';
import {
  tendozBrandLogoImg,
  carouselBanner1Img,
  carouselBanner2Img,
  carouselBanner3Img,
  CATEGORY_BANNERS,
} from '../data/initialData';
import { normalizeImageUrl } from './imageUtils';

/**
 * Image Preloader Promise Utility with high-performance timeout resilience.
 * Resolves as soon as the image is ready (from cache or network) or when timeout expires.
 */
export const preloadImage = (src: string, timeoutMs: number = 1200): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!src) {
      resolve(true);
      return;
    }
    const cleanUrl = normalizeImageUrl(src);
    const img = new Image();
    let settled = false;
    const finish = (ok: boolean) => {
      if (!settled) {
        settled = true;
        resolve(ok);
      }
    };
    const timer = setTimeout(() => finish(true), timeoutMs);
    img.src = cleanUrl;
    if (img.complete && img.naturalWidth > 0) {
      clearTimeout(timer);
      finish(true);
    } else {
      img.onload = () => {
        clearTimeout(timer);
        finish(true);
      };
      img.onerror = () => {
        clearTimeout(timer);
        finish(false); // Graceful recovery on any network anomaly
      };
    }
  });
};

/**
 * Launch Priority: Ensures Top Header Logo, Promotional Carousel Banner,
 * and top popular items are preloaded in parallel with lightning-fast execution (<350ms cap).
 */
export const preloadLaunchAssets = async (): Promise<void> => {
  // Preload critical viewport assets in parallel
  const primaryPromises = [
    preloadImage(tendozBrandLogoImg, 900),
    preloadImage(carouselBanner1Img, 900),
  ];

  // Secondary banners load non-blocking in background
  preloadImage(carouselBanner2Img, 2000);
  preloadImage(carouselBanner3Img, 2000);

  // Preload top popular items in parallel so they are instantly cached
  const topPopularSamples = [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  ];
  topPopularSamples.forEach((url) => preloadImage(url, 1200));

  await Promise.race([
    Promise.all(primaryPromises),
    new Promise((resolve) => setTimeout(resolve, 350)),
  ]);
};

/**
 * Prioritized 3-Stage Image Loading Hierarchy
 * 
 * Stage 1 (First Priority): Top product images immediately right after skeleton dismissal.
 * Stage 2 (Second Priority): First 4 category banners ('Popular', 'Pizzas', 'Burgers', 'Deals') & their products.
 * Stage 3 (Final Stage): Remaining category banners & products across full menu.
 */
export const startImageLoadingHierarchy = (items: MenuItem[]) => {
  // --- Stage 1: Top Product Images (Immediate) ---
  const topProductSlugs = ['pocket-pizza', 'sando', 'zingo-tringo', 'chicken-tikka-pizza', 'zingo-deal'];
  const topProducts = items
    .filter((i) => i.isPopular || topProductSlugs.some((slug) => i.id.includes(slug)))
    .slice(0, 8);

  const stage1Images = topProducts.map((p) => p.image).filter(Boolean);

  Promise.all(stage1Images.map(preloadImage)).then(() => {
    // --- Stage 2: First 4 Category Banners & Respective Product Images ---
    const first4Categories = ['Popular', 'Pizzas', 'Burgers', 'Deals'];
    const stage2BannerUrls = first4Categories
      .map((cat) => CATEGORY_BANNERS[cat])
      .filter(Boolean);

    const stage2ProductImages = items
      .filter((i) => {
        const cat = i.category;
        return (
          cat === 'Popular' ||
          cat === 'Pizzas' ||
          cat === 'Pizza' ||
          cat === 'Burgers' ||
          cat === 'Deals'
        );
      })
      .slice(0, 16)
      .map((i) => i.image)
      .filter(Boolean);

    const stage2All = [...stage2BannerUrls, ...stage2ProductImages];

    Promise.all(stage2All.map(preloadImage)).then(() => {
      // --- Stage 3: All Remaining Category Banners & Product Images (Background / Idle) ---
      const triggerStage3 = () => {
        const remainingCategoryBanners = Object.entries(CATEGORY_BANNERS)
          .filter(([cat]) => !first4Categories.includes(cat))
          .map(([, url]) => url)
          .filter(Boolean);

        const loadedImageSet = new Set([...stage1Images, ...stage2All]);
        const remainingProductImages = items
          .map((i) => i.image)
          .filter((url) => Boolean(url) && !loadedImageSet.has(url));

        const stage3All = [...remainingCategoryBanners, ...remainingProductImages];

        // Batch preloading remaining in chunks of 6 to keep main thread completely smooth
        const chunkSize = 6;
        let index = 0;

        const loadNextChunk = () => {
          if (index >= stage3All.length) return;
          const chunk = stage3All.slice(index, index + chunkSize);
          index += chunkSize;
          Promise.all(chunk.map(preloadImage)).finally(() => {
            if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
              window.requestIdleCallback(loadNextChunk);
            } else {
              setTimeout(loadNextChunk, 150);
            }
          });
        };

        loadNextChunk();
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(triggerStage3);
      } else {
        setTimeout(triggerStage3, 200);
      }
    });
  });
};
