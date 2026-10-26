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
 * Launch Priority: Ensures Top Header Logo and Primary Hero Carousel Banner
 * are preloaded in parallel with an ultra-snappy execution timeout (<250ms cap).
 */
export const preloadLaunchAssets = async (): Promise<void> => {
  const primaryPromises = [
    preloadImage(tendozBrandLogoImg, 200),
    preloadImage(carouselBanner1Img, 200),
  ];

  // Resolve as soon as both are ready or at max 80ms so LCP is not delayed
  await Promise.race([
    Promise.all(primaryPromises),
    new Promise((resolve) => setTimeout(resolve, 80)),
  ]);
};

/**
 * Prioritized Background Image Hierarchy:
 * Only pre-caches next carousel slide in idle time without flooding the network.
 * Below-the-fold food catalog images are loaded smoothly and on-demand via native HTML loading="lazy".
 */
export const startImageLoadingHierarchy = (_items: MenuItem[]) => {
  const idlePreload = () => {
    // Only pre-warm the immediate 2nd and 3rd carousel banners in the background
    preloadImage(carouselBanner2Img, 2500);
    preloadImage(carouselBanner3Img, 2500);
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(idlePreload);
  } else {
    setTimeout(idlePreload, 400);
  }
};

