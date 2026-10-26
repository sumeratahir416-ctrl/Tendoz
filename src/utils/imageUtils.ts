/**
 * Image helper utility to ensure robust image loading across Tendoz app.
 * Resolves kommodo.ai viewer page URLs to their direct high-resolution webp image URLs.
 */

export const DEFAULT_FOOD_FALLBACK =
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';

const KOMMODO_DIRECT_MAP: Record<string, string> = {
  rZpHkA5a2ds1ilE4u3RI: 'https://plain-eeur-prod-public.komododecks.com/202610/14/rZpHkA5a2ds1ilE4u3RI/image.webp',
  FB1RX0eWpxsadZkfH6Xp: 'https://plain-eeur-prod-public.komododecks.com/202610/14/FB1RX0eWpxsadZkfH6Xp/image.webp',
  ENPXyd2fKW7fUNCdA92e: 'https://plain-eeur-prod-public.komododecks.com/202610/14/ENPXyd2fKW7fUNCdA92e/image.webp',
  A6ifRe5H7GsCJhnU4lnn: 'https://plain-eeur-prod-public.komododecks.com/202610/14/A6ifRe5H7GsCJhnU4lnn/image.webp',
  YhTGrf6uZI5kD0Z8wlJe: 'https://plain-eeur-prod-public.komododecks.com/202610/14/YhTGrf6uZI5kD0Z8wlJe/image.webp',
  KprSEbm8mgbk4ZWAwDxO: 'https://plain-eeur-prod-public.komododecks.com/202610/14/KprSEbm8mgbk4ZWAwDxO/image.webp',
  wcDWx8XSkPRUrwkptqQT: 'https://plain-eeur-prod-public.komododecks.com/202610/14/wcDWx8XSkPRUrwkptqQT/image.webp',
  AfH0mY1duFJxVWaFNjY3: 'https://plain-eeur-prod-public.komododecks.com/202610/14/AfH0mY1duFJxVWaFNjY3/image.webp',
  RQpXLYGtm4DHO2Zo06T4: 'https://plain-eeur-prod-public.komododecks.com/202610/14/RQpXLYGtm4DHO2Zo06T4/image.webp',
  Ry2V2VBFXBkoK9SyIEUQ: 'https://plain-eeur-prod-public.komododecks.com/202610/14/Ry2V2VBFXBkoK9SyIEUQ/image.webp',
  w6B2VcUbsySgiihZxVjk: 'https://plain-eeur-prod-public.komododecks.com/202610/14/w6B2VcUbsySgiihZxVjk/image.webp',
  '7qnLobMbNzV8DwzpUKog': 'https://plain-eeur-prod-public.komododecks.com/202610/14/7qnLobMbNzV8DwzpUKog/image.webp',
  // Burgers
  gmI2wqSNyAYk0xraWgNB: 'https://plain-eeur-prod-public.komododecks.com/202610/15/gmI2wqSNyAYk0xraWgNB/image.webp',
  s0bViJE2zM7eqwihVkQ8: 'https://plain-eeur-prod-public.komododecks.com/202610/15/s0bViJE2zM7eqwihVkQ8/image.webp',
  OskfKKqiMAlrQT8SgrRS: 'https://plain-eeur-prod-public.komododecks.com/202610/15/OskfKKqiMAlrQT8SgrRS/image.webp',
  nG2yLtF3eiBmcm6Q6QVh: 'https://plain-eeur-prod-public.komododecks.com/202610/15/nG2yLtF3eiBmcm6Q6QVh/image.webp',
  zOmXWcCSKJmTAK0HVsqp: 'https://plain-eeur-prod-public.komododecks.com/202610/15/zOmXWcCSKJmTAK0HVsqp/image.webp',
  YkxfrRQyZmflPPseCS4r: 'https://plain-eeur-prod-public.komododecks.com/202610/15/YkxfrRQyZmflPPseCS4r/image.webp',
  u77EcuUZnF6XWqNe0Z0j: 'https://plain-eeur-prod-public.komododecks.com/202610/15/u77EcuUZnF6XWqNe0Z0j/image.webp',
  y6GWkuDUfKgbG3DqB7XV: 'https://plain-eeur-prod-public.komododecks.com/202610/15/y6GWkuDUfKgbG3DqB7XV/image.webp',
  fedBuiLUH5WtVrTMi1s2: 'https://plain-eeur-prod-public.komododecks.com/202610/15/fedBuiLUH5WtVrTMi1s2/image.webp',
  fNNs5EdK8crMDCjR6K2m: 'https://plain-eeur-prod-public.komododecks.com/202610/15/fNNs5EdK8crMDCjR6K2m/image.webp',
  // Pizzas
  wlhUuy0BBeNb5GBQwNAm: 'https://plain-eeur-prod-public.komododecks.com/202610/15/wlhUuy0BBeNb5GBQwNAm/image.webp',
  cD6uJQi2duIurF7pJbsj: 'https://plain-eeur-prod-public.komododecks.com/202610/15/cD6uJQi2duIurF7pJbsj/image.webp',
  DlSSjnV7rjSqovZwWfCc: 'https://plain-eeur-prod-public.komododecks.com/202610/15/DlSSjnV7rjSqovZwWfCc/image.webp',
  IsmEU3DVXZXH6Fj37vL4: 'https://plain-eeur-prod-public.komododecks.com/202610/15/IsmEU3DVXZXH6Fj37vL4/image.webp',
  zuOgoSG8iFgduRF0wjVj: 'https://plain-eeur-prod-public.komododecks.com/202610/15/zuOgoSG8iFgduRF0wjVj/image.webp',
  bvdL1dQWV2ie6in2oCg6: 'https://plain-eeur-prod-public.komododecks.com/202610/15/bvdL1dQWV2ie6in2oCg6/image.webp',
  W1fDilvW0Aq75AgwNoqW: 'https://plain-eeur-prod-public.komododecks.com/202610/15/W1fDilvW0Aq75AgwNoqW/image.webp',
  MHCmzuDKHKQIi7PnYF1E: 'https://plain-eeur-prod-public.komododecks.com/202610/15/MHCmzuDKHKQIi7PnYF1E/image.webp',
  MFTmJD7ahO4RWMCTVG2W: 'https://plain-eeur-prod-public.komododecks.com/202610/15/MFTmJD7ahO4RWMCTVG2W/image.webp',
  EE8J3biOM4QZ1jfWSLVY: 'https://plain-eeur-prod-public.komododecks.com/202610/15/EE8J3biOM4QZ1jfWSLVY/image.webp',
  VqabyOSopwaovphvETNm: 'https://plain-eeur-prod-public.komododecks.com/202610/15/VqabyOSopwaovphvETNm/image.webp',
  YxjB3cefhU8PqpYuaT12: 'https://plain-eeur-prod-public.komododecks.com/202610/15/YxjB3cefhU8PqpYuaT12/image.webp',
  uAGdzW1JVfTJnapdCcxq: 'https://plain-eeur-prod-public.komododecks.com/202610/15/uAGdzW1JVfTJnapdCcxq/image.webp',
  '3c1WKjSxO64c2CWepmyp': 'https://plain-eeur-prod-public.komododecks.com/202610/15/3c1WKjSxO64c2CWepmyp/image.webp',
  // Featured / Popular Items
  '6YLfahKSGwnrfuq3aTCs': 'https://plain-eeur-prod-public.komododecks.com/202610/16/6YLfahKSGwnrfuq3aTCs/image.webp',
  fQuipF3gqyk8wuuTP8ZS: 'https://plain-eeur-prod-public.komododecks.com/202610/16/fQuipF3gqyk8wuuTP8ZS/image.webp',
  '325VSCyY4RO4oqfL8mEq': 'https://plain-eeur-prod-public.komododecks.com/202610/16/325VSCyY4RO4oqfL8mEq/image.webp',
  // Wraps
  qtkl3nRsnbi7p9kHYkX6: 'https://plain-eeur-prod-public.komododecks.com/202610/16/qtkl3nRsnbi7p9kHYkX6/image.webp',
  moNvVSfBTDOx8oHQmtL9: 'https://plain-eeur-prod-public.komododecks.com/202610/16/moNvVSfBTDOx8oHQmtL9/image.webp',
  '8C60CMXPmpqA1dzlqcvf': 'https://plain-eeur-prod-public.komododecks.com/202610/16/8C60CMXPmpqA1dzlqcvf/image.webp',
  ApYBQ2pEfKmjNwary0CO: 'https://plain-eeur-prod-public.komododecks.com/202610/16/ApYBQ2pEfKmjNwary0CO/image.webp',
  FYLjnjlWu3cXCHKwyIXv: 'https://plain-eeur-prod-public.komododecks.com/202610/16/FYLjnjlWu3cXCHKwyIXv/image.webp',
  // Fried Chicken
  R2vp8TvUYDrN7j3ru4zW: 'https://plain-eeur-prod-public.komododecks.com/202610/16/R2vp8TvUYDrN7j3ru4zW/image.webp',
  qMOZlhW2ozj2CdMfHQnO: 'https://plain-eeur-prod-public.komododecks.com/202610/16/qMOZlhW2ozj2CdMfHQnO/image.webp',
  // Pasta
  tI09LeWUGresOtmUkUWS: 'https://plain-eeur-prod-public.komododecks.com/202610/16/tI09LeWUGresOtmUkUWS/image.webp',
  o8etMPRLsCHp7fxB47mn: 'https://plain-eeur-prod-public.komododecks.com/202610/16/o8etMPRLsCHp7fxB47mn/image.webp',
  // Single Product
  '12ddxe8EWrbGbSj6RPgi': 'https://plain-eeur-prod-public.komododecks.com/202610/17/12ddxe8EWrbGbSj6RPgi/image.webp',
  // Deals
  bWDgrSuweBi4n4em6hgK: 'https://plain-eeur-prod-public.komododecks.com/202610/17/bWDgrSuweBi4n4em6hgK/image.webp',
  '8hRNwqS6GGpxTjpMeQk3': 'https://plain-eeur-prod-public.komododecks.com/202610/17/8hRNwqS6GGpxTjpMeQk3/image.webp',
  '6nfCgzwXcZ1oqJjTHUPd': 'https://plain-eeur-prod-public.komododecks.com/202610/17/6nfCgzwXcZ1oqJjTHUPd/image.webp',
  PwpWfIpNcRKA1cMALqZb: 'https://plain-eeur-prod-public.komododecks.com/202610/17/PwpWfIpNcRKA1cMALqZb/image.webp',
  '2PJBJwMyYU4RP1A9fcA4': 'https://plain-eeur-prod-public.komododecks.com/202610/17/2PJBJwMyYU4RP1A9fcA4/image.webp',
  h4XodgxZmbypRWJHgjOf: 'https://plain-eeur-prod-public.komododecks.com/202610/17/h4XodgxZmbypRWJHgjOf/image.webp',
  sk6Feh29PHSDKvKksaNb: 'https://plain-eeur-prod-public.komododecks.com/202610/17/sk6Feh29PHSDKvKksaNb/image.webp',
  oYQawevKFJf9KGl8ZDWg: 'https://plain-eeur-prod-public.komododecks.com/202610/17/oYQawevKFJf9KGl8ZDWg/image.webp',
  YsM5vFIy2CqqtdRtSptC: 'https://plain-eeur-prod-public.komododecks.com/202610/17/YsM5vFIy2CqqtdRtSptC/image.webp',
  CH5bH4zFRQE1srRSjYrf: 'https://plain-eeur-prod-public.komododecks.com/202610/17/CH5bH4zFRQE1srRSjYrf/image.webp',
  cM80SvKl5YJPeQUkg2Yr: 'https://plain-eeur-prod-public.komododecks.com/202610/17/cM80SvKl5YJPeQUkg2Yr/image.webp',
  VQFGJE6g9oU2xUCEp6Nr: 'https://plain-eeur-prod-public.komododecks.com/202610/17/VQFGJE6g9oU2xUCEp6Nr/image.webp',
  xlBj7NTc3Pah9LqdS4xR: 'https://plain-eeur-prod-public.komododecks.com/202610/17/xlBj7NTc3Pah9LqdS4xR/image.webp',
  '6xEW5vPBcZA97ApQReCn': 'https://plain-eeur-prod-public.komododecks.com/202610/17/6xEW5vPBcZA97ApQReCn/image.webp',
  xkna60m4DBut337GoOCZ: 'https://plain-eeur-prod-public.komododecks.com/202610/17/xkna60m4DBut337GoOCZ/image.webp',
  drMP07po82WVCaiJR4Cd: 'https://plain-eeur-prod-public.komododecks.com/202610/17/drMP07po82WVCaiJR4Cd/image.webp',
  a2wjsbssXfwKc62BkSC9: 'https://plain-eeur-prod-public.komododecks.com/202610/18/a2wjsbssXfwKc62BkSC9/image.webp',
  eLLos3b8P0BmrJn5Zl3O: 'https://plain-eeur-prod-public.komododecks.com/202610/18/eLLos3b8P0BmrJn5Zl3O/image.webp',
  // 3rd Carousel Banner
  rwSOSTEhmpirMuJSTXcL: 'https://plain-eeur-prod-public.komododecks.com/202610/18/rwSOSTEhmpirMuJSTXcL/image.webp',
  // Deals
  aiN1H94OoSkZxRBFEgc1: 'https://plain-eeur-prod-public.komododecks.com/202610/18/aiN1H94OoSkZxRBFEgc1/image.webp',
  // Flavoured Soda
  x7cz0SGQk79L5BYSygnK: 'https://plain-eeur-prod-public.komododecks.com/202610/18/x7cz0SGQk79L5BYSygnK/image.webp',
  '0dv1sw5rHRED3xglu6Uq': 'https://plain-eeur-prod-public.komododecks.com/202610/18/0dv1sw5rHRED3xglu6Uq/image.webp',
  UXrkCuL4Qr0q1USyE678: 'https://plain-eeur-prod-public.komododecks.com/202610/18/UXrkCuL4Qr0q1USyE678/image.webp',
  uWqTACTekxocAEc0CnEQ: 'https://plain-eeur-prod-public.komododecks.com/202610/18/uWqTACTekxocAEc0CnEQ/image.webp',
  iOxRDsUhH9XWsl45HN9L: 'https://plain-eeur-prod-public.komododecks.com/202610/18/iOxRDsUhH9XWsl45HN9L/image.webp',
  // Soft Drinks
  Uge6FtmkAymVWpbx5d12: 'https://plain-eeur-prod-public.komododecks.com/202610/18/Uge6FtmkAymVWpbx5d12/image.webp',
  '6oDdXukbTROskN0vUlgD': 'https://plain-eeur-prod-public.komododecks.com/202610/18/6oDdXukbTROskN0vUlgD/image.webp',
  pud0m3UyL0fM2i0Cy0Vn: 'https://plain-eeur-prod-public.komododecks.com/202610/18/pud0m3UyL0fM2i0Cy0Vn/image.webp',
  VirCtGTOypuhZrrFGx9j: 'https://plain-eeur-prod-public.komododecks.com/202610/18/VirCtGTOypuhZrrFGx9j/image.webp',
  uCjoZYWsc9oBWfhDholp: 'https://plain-eeur-prod-public.komododecks.com/202610/18/uCjoZYWsc9oBWfhDholp/image.webp',
  // Pizzas
  Vn3FHvtoM0EmN2vqffZ3: 'https://plain-eeur-prod-public.komododecks.com/202610/18/Vn3FHvtoM0EmN2vqffZ3/image.webp',
  '2VTNqejtKVVmJs2MVNid': 'https://plain-eeur-prod-public.komododecks.com/202610/18/2VTNqejtKVVmJs2MVNid/image.webp',
  '4G7o4YWUJUT978mmVyk5': 'https://plain-eeur-prod-public.komododecks.com/202610/18/4G7o4YWUJUT978mmVyk5/image.webp',
};

/**
 * Normalizes any image URL. If it's a kommodo.ai viewer page URL,
 * extracts the ID and returns the direct webp image URL.
 */
export function normalizeImageUrl(url?: string): string {
  if (!url) return DEFAULT_FOOD_FALLBACK;

  const trimmed = url.trim();

  // Match kommodo.ai viewer URL: https://kommodo.ai/i/{ID}
  const kommodoMatch = trimmed.match(/kommodo\.ai\/i\/([a-zA-Z0-9_-]+)/);
  if (kommodoMatch && kommodoMatch[1]) {
    const id = kommodoMatch[1];
    if (KOMMODO_DIRECT_MAP[id]) {
      return KOMMODO_DIRECT_MAP[id];
    }
    // Generic direct CDN pattern
    return `https://plain-eeur-prod-public.komododecks.com/202610/16/${id}/image.webp`;
  }

  return trimmed;
}

/**
 * Image error handler fallback to avoid any broken image placeholders
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback = DEFAULT_FOOD_FALLBACK
) {
  const target = event.currentTarget;
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
