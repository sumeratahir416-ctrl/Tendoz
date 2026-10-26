/**
 * Location formatting utilities for Tendoz Restaurant
 * Automatically formats and appends the selected area in brackets [Area]
 * to the address/location field in both the backend database (Firestore)
 * and WhatsApp checkout messages.
 */

export function cleanAreaName(area?: string): string {
  if (!area) return '';
  return area.trim().replace(/^\[+|\]+$/g, '').trim();
}

export function formatLocationTag(area?: string): string {
  const clean = cleanAreaName(area);
  return clean ? `[${clean}]` : '';
}

export function formatAddressWithLocationTag(
  rawAddress?: string,
  selectedArea?: string
): string {
  const cleanArea = cleanAreaName(selectedArea);
  let baseAddress = (rawAddress || '').trim();

  if (!cleanArea) {
    return baseAddress;
  }

  // Strip any existing trailing bracketed location tag (e.g., "[Farid Town]")
  baseAddress = baseAddress.replace(/\s*\[[^\]]+\]\s*$/g, '').trim();

  // If empty or identical to the area itself, return bracketed area
  if (!baseAddress || baseAddress.toLowerCase() === cleanArea.toLowerCase()) {
    return `[${cleanArea}]`;
  }

  return `${baseAddress} [${cleanArea}]`;
}
