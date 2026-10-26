import React, { useState, useEffect } from 'react';
import { X, Share2, Plus, Minus, Trash2, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, PizzaSize } from '../../types';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';

import { INITIAL_MENU_ITEMS } from '../../data/initialData';

export interface AddOnOption {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export const PIZZA_ADD_ONS: AddOnOption[] = [
  { id: 'extra-chicken-s', name: 'Extra Chicken Small', description: 'Small pizza extra chicken topping', price: 100 },
  { id: 'extra-chicken-m', name: 'Extra Chicken Medium', description: 'Medium pizza extra chicken topping', price: 170 },
  { id: 'extra-chicken-l', name: 'Extra Chicken Large', description: 'Large pizza extra chicken topping', price: 250 },
  { id: 'extra-cheese-s', name: 'Extra Small Cheese', description: 'Small pizza extra mozzarella cheese', price: 100 },
  { id: 'extra-cheese-m', name: 'Extra Medium Cheese', description: 'Medium pizza extra mozzarella cheese', price: 170 },
  { id: 'extra-cheese-l', name: 'Extra Large Cheese', description: 'Large pizza extra mozzarella cheese', price: 250 },
];

export const BURGER_ADD_ONS: AddOnOption[] = [
  { id: 'cheese-slice', name: 'Cheese Slice', description: 'Melted cheddar cheese slice', price: 60 },
  { id: 'extra-bun', name: 'Bun', description: 'Extra toasted brioche bun', price: 70 },
];

export const SAUCE_ADD_ONS: AddOnOption[] = [
  { id: 'dynamite-sauce', name: 'Dynamite Sauce', description: 'Spicy signature dynamite dipping sauce', price: 100 },
  { id: 'garlic-mayo-sauce', name: 'Garlic Mayo Sauce', description: 'Creamy garlic mayonnaise sauce', price: 70 },
  { id: 'tendoz-special-sauce', name: 'Tendoz Special Sauce', description: 'Secret house special dipping sauce', price: 70 },
  { id: 'burger-sauce', name: 'Burger Sauce', description: 'Classic tangy burger sauce', price: 70 },
];

export const DEFAULT_ADD_ONS: AddOnOption[] = [
  ...PIZZA_ADD_ONS,
  ...BURGER_ADD_ONS,
  ...SAUCE_ADD_ONS,
];

export function getAddOnsForMenuItem(item: MenuItem | null): AddOnOption[] {
  if (!item) return [];

  const category = (item.category || '').toString().toLowerCase();
  const name = (item.name || '').toLowerCase();
  const description = (item.description || '').toLowerCase();
  const tag = (item.tag || '').toLowerCase();
  const text = `${name} ${description} ${tag}`;

  // 1. Pizza check
  const isPizzaCategory = category === 'pizza' || category === 'pizzas';
  const hasPizzaSizes = Boolean(item.sizes && item.sizes.length > 0);
  const isPizzaDeal = text.includes('pizza');
  const isPizzaItem = isPizzaCategory || hasPizzaSizes || isPizzaDeal;

  // 2. Burger check
  const isBurgerCategory = category === 'burger' || category === 'burgers';
  const isBurgerDeal = text.includes('burger') || text.includes('smash') || text.includes('zinger');
  const isBurgerItem = isBurgerCategory || isBurgerDeal;

  // 3. Sauces check (Wraps / Fried Chicken / Sando / Broast / Burgers / Deals containing Burgers or chicken)
  const isWrapCategory = category === 'wraps' || category === 'wrap' || text.includes('wrap');
  const isFriedChickenCategory =
    category === 'fried chicken' ||
    text.includes('fried chicken') ||
    text.includes('tender') ||
    text.includes('wings') ||
    text.includes('nugget');
  const isSandoBroastCategory =
    category === 'injected broast' || text.includes('broast') || text.includes('sando');

  const isSauceItem = isWrapCategory || isFriedChickenCategory || isSandoBroastCategory || isBurgerItem;

  const list: AddOnOption[] = [];
  const seen = new Set<string>();

  const append = (addons: AddOnOption[]) => {
    for (const a of addons) {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        list.push(a);
      }
    }
  };

  if (isPizzaItem) {
    append(PIZZA_ADD_ONS);
  }

  if (isBurgerItem) {
    append(BURGER_ADD_ONS);
  }

  if (isSauceItem) {
    append(SAUCE_ADD_ONS);
  }

  return list;
}

interface ProductDetailModalProps {
  isOpen: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    options?: {
      addOns?: string[];
      notes?: string;
      total?: number;
      size?: PizzaSize;
      price?: number;
      basePrice?: number;
      addOnsPrice?: number;
      fromPDP?: boolean;
    }
  ) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  item,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  const effectiveSizes =
    item?.sizes && item.sizes.length > 0
      ? item.sizes
      : INITIAL_MENU_ITEMS.find((i) => i.id === item?.id)?.sizes || [];

  const hasSizes = Boolean(effectiveSizes && effectiveSizes.length > 0);
  const isPizza = Boolean(
    item &&
      (item.category === 'Pizza' ||
        item.category === 'Pizzas' ||
        (hasSizes &&
          effectiveSizes.some((s) => ['Small', 'Medium', 'Large'].includes(s.size))))
  );

  const [selectedSize, setSelectedSize] = useState<PizzaSize>('Small');

  const availableAddOns = getAddOnsForMenuItem(item);

  // Reset state when opening a new item
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedAddOnIds([]);
      setSpecialInstructions('');
      setCopiedShare(false);
      if (effectiveSizes && effectiveSizes.length > 0) {
        setSelectedSize(effectiveSizes[0].size);
      } else {
        setSelectedSize('Small');
      }
    }
  }, [isOpen, item?.id]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `Tendoz - ${item.name}`,
        text: `Order ${item.name} at Tendoz Restaurant!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Calculate pricing taking chosen size/variant into account
  const currentSizeOption = hasSizes && effectiveSizes.length > 0
    ? effectiveSizes.find((s) => s.size === selectedSize) || effectiveSizes[0]
    : undefined;
  const currentBasePrice = currentSizeOption ? currentSizeOption.price : item.price;

  const addOnsTotal = selectedAddOnIds.reduce((sum, id) => {
    const addOn = availableAddOns.find((a) => a.id === id);
    return sum + (addOn?.price || 0);
  }, 0);

  const unitTotal = currentBasePrice + addOnsTotal;
  const totalPrice = unitTotal * quantity;

  const handleAddAction = () => {
    const selectedNames = selectedAddOnIds
      .map((id) => availableAddOns.find((a) => a.id === id)?.name)
      .filter(Boolean) as string[];

    onAddToCart(item, quantity, {
      addOns: selectedNames,
      notes: specialInstructions.trim() || undefined,
      total: totalPrice,
      size: hasSizes ? selectedSize : undefined,
      price: unitTotal, // Combined item base price + add-ons
      basePrice: currentBasePrice,
      addOnsPrice: addOnsTotal,
      fromPDP: true,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/70 backdrop-blur-xs select-none">
        {/* Backdrop click dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Centered Modal Card with Balanced Padding & Margins - Borderless Modern Design */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12, transition: { duration: 0.16, ease: [0.32, 0, 0.67, 0] } }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md sm:max-w-lg bg-white rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] flex flex-col max-h-[90vh] my-auto border-0 outline-none z-10"
        >
          {/* ============================================================ */}
          {/* SCROLLABLE MODAL BODY (NON-STICKY IMAGE + CONTENT TOGETHER) */}
          {/* ============================================================ */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* 1. TOP HERO FOOD IMAGE (Clean, unshadowed product image) */}
            <div className="relative w-full h-80 sm:h-96 bg-neutral-100 shrink-0 overflow-hidden">
              <img
                src={normalizeImageUrl(item.image)}
                alt={item.name}
                onError={handleImageError}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Floating Action Buttons in Top Right */}
              <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
                {/* Share Icon Button */}
                <button
                  onClick={handleShare}
                  title="Share this dish"
                  aria-label="Share dish"
                  className="w-9 h-9 rounded-full bg-black/45 hover:bg-black/65 text-white backdrop-blur-xs flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {copiedShare ? (
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  ) : (
                    <Share2 className="w-4 h-4 stroke-[2.3]" />
                  )}
                </button>

                {/* Red Close 'X' Button Matching Reference Images - Instant trigger & fluid zero-lag transitions */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  title="Close"
                  aria-label="Close modal"
                  className="w-9 h-9 rounded-full bg-[#D81A07] hover:bg-[#b81505] active:bg-[#991104] text-white flex items-center justify-center transition-all duration-150 ease-out active:scale-90 hover:scale-105 cursor-pointer shadow-md shadow-black/30 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/40 select-none touch-manipulation"
                >
                  <X className="w-5 h-5 stroke-[2.8] transition-transform duration-150 group-active:rotate-90" />
                </button>
              </div>
            </div>

            {/* 2. CONTENT BODY (NAME, PRICE, DESCRIPTION, ADD-ONS) */}
            <div className="p-4 sm:p-5 space-y-5">
              {/* Product Name, Price & Serving Info */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight leading-snug">
                  {item.name}
                </h2>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                    Rs. {currentBasePrice.toLocaleString()}
                  </span>
                  {item.servings && (
                    <span className="text-xs font-semibold text-neutral-500">
                      {item.servings}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal mt-2">
                  {item.description ||
                    'Served With Fresh Hot Crispy Fries – Signature Spice Injected Recipe Prepared Fresh With Chef Sauces & Seasonings.'}
                </p>
              </div>

            {/* Size / Variant Selection (Pizza Sizes, Appetizer Portions, Deal Options) */}
            {hasSizes && effectiveSizes.length > 0 && (() => {
              const isOptionList = effectiveSizes.some(
                (s) => s.size.startsWith('Option') || (s.label && s.label.length > 25)
              );
              const sectionTitle =
                item.category === 'Pizzas' || item.category === 'Pizza'
                  ? 'Select Pizza Size'
                  : item.id === 'bacha-party-meal' || isOptionList
                  ? 'Select Meal Combination'
                  : 'Select Portion / Size';

              return (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight">
                        {sectionTitle}
                      </span>
                      <span className="text-xs text-neutral-400 font-medium">
                        (Choose 1)
                      </span>
                    </div>
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-red-50 text-[#D81A07] border border-red-200/60 uppercase tracking-wide">
                      *REQUIRED
                    </span>
                  </div>

                  {isOptionList ? (
                    /* Stacked list layout for long choices like Bacha Party Meal */
                    <div className="space-y-2">
                      {effectiveSizes.map((sizeOpt) => {
                        const isSelected = selectedSize === sizeOpt.size;
                        return (
                          <button
                            key={sizeOpt.size}
                            type="button"
                            onClick={() => setSelectedSize(sizeOpt.size)}
                            className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex items-center justify-between gap-3 select-none ${
                              isSelected
                                ? 'border-[#D81A07] bg-red-50/50 ring-2 ring-[#D81A07]/20 shadow-xs'
                                : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-1">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? 'border-[#D81A07] bg-[#D81A07]'
                                    : 'border-neutral-300 bg-white'
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3 h-3 text-white stroke-[3]" />
                                )}
                              </div>
                              <span
                                className={`text-xs sm:text-sm font-bold leading-snug ${
                                  isSelected ? 'text-[#D81A07]' : 'text-neutral-900'
                                }`}
                              >
                                {sizeOpt.label || sizeOpt.size}
                              </span>
                            </div>
                            <span
                              className={`font-black text-xs sm:text-sm shrink-0 ${
                                isSelected ? 'text-[#D81A07]' : 'text-neutral-800'
                              }`}
                            >
                              Rs. {sizeOpt.price.toLocaleString()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Grid layout for short options (Wings, Fries, Pizza) */
                    <div
                      className={`grid gap-2 sm:gap-2.5 ${
                        effectiveSizes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                      }`}
                    >
                      {effectiveSizes.map((sizeOpt) => {
                        const isSelected = selectedSize === sizeOpt.size;
                        return (
                          <button
                            key={sizeOpt.size}
                            type="button"
                            onClick={() => setSelectedSize(sizeOpt.size)}
                            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative select-none ${
                              isSelected
                                ? 'border-[#D81A07] bg-red-50/50 ring-2 ring-[#D81A07]/20 shadow-xs'
                                : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50/50'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#D81A07] text-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                            <span
                              className={`block font-black text-xs sm:text-sm ${
                                isSelected ? 'text-[#D81A07]' : 'text-neutral-900'
                              }`}
                            >
                              {sizeOpt.label || sizeOpt.size}
                            </span>
                            {sizeOpt.inches && (
                              <span className="block text-[10px] sm:text-[11px] text-neutral-400 font-medium mt-0.5">
                                {sizeOpt.inches}
                              </span>
                            )}
                            <span
                              className={`block font-extrabold text-xs mt-1.5 ${
                                isSelected ? 'text-[#D81A07]' : 'text-neutral-700'
                              }`}
                            >
                              Rs. {sizeOpt.price.toLocaleString()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Add-Ons Section (Optional) */}
            {availableAddOns.length > 0 && (
              <>
                <div className="h-px bg-neutral-100" />
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight">
                      Add Ons
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-[#D81A07] border border-red-200/60">
                      Optional
                    </span>
                  </div>

                  {/* Add-Ons List with Checkboxes */}
                  <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden divide-y divide-neutral-100">
                    {availableAddOns.map((addOn) => {
                      const isChecked = selectedAddOnIds.includes(addOn.id);
                      return (
                        <label
                          key={addOn.id}
                          onClick={() => toggleAddOn(addOn.id)}
                          className={`flex items-center justify-between p-3 sm:p-3.5 transition-colors cursor-pointer select-none ${
                            isChecked ? 'bg-red-50/30' : 'hover:bg-neutral-50/70'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            {/* Custom Checkbox */}
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                                isChecked
                                  ? 'bg-[#D81A07] border-[#D81A07] text-white'
                                  : 'border-neutral-300 bg-white'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="min-w-0">
                              <span className="block text-xs sm:text-sm font-bold text-neutral-900 truncate">
                                {addOn.name}
                              </span>
                              {addOn.description && (
                                <span className="block text-[11px] text-neutral-400 font-medium truncate">
                                  {addOn.description}
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="text-xs sm:text-sm font-black text-neutral-900 shrink-0">
                            + Rs. {addOn.price}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Special Instructions Section */}
            <div className="space-y-2 pt-1">
              <span className="block text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight">
                Special Instructions
              </span>

              <div className="relative bg-neutral-50/80 border border-neutral-200/90 rounded-2xl p-3 focus-within:border-[#D81A07] focus-within:bg-white transition-all">
                <textarea
                  rows={3}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value.slice(0, 500))}
                  placeholder="Please enter instructions about this item"
                  maxLength={500}
                  className="w-full bg-transparent text-xs sm:text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none resize-none font-normal"
                />
                <div className="text-right text-[10px] text-neutral-400 font-medium">
                  {specialInstructions.length}/500
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* ============================================================ */}
          {/* 3. STICKY BOTTOM ACTION BAR (QUANTITY & SHIMMER ADD TO CART) */}
          {/* ============================================================ */}
          <div className="border-t border-neutral-100 bg-white p-3.5 sm:p-4 flex items-center gap-3 shrink-0">
            {/* Quantity Pill Controls */}
            <div className="flex items-center bg-red-50/70 border border-red-200/60 rounded-2xl p-1 gap-1.5 sm:gap-2 shrink-0">
              {/* Minus / Delete Button */}
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label={quantity === 1 ? 'Minimum 1 item' : 'Decrease quantity'}
                className="w-8 h-8 rounded-xl bg-red-100/70 hover:bg-red-200/70 text-[#D81A07] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              >
                {quantity === 1 ? (
                  <Trash2 className="w-3.5 h-3.5 text-[#D81A07]" />
                ) : (
                  <Minus className="w-3.5 h-3.5 stroke-[2.8] text-[#D81A07]" />
                )}
              </button>

              {/* Quantity Count */}
              <span className="w-6 text-center text-sm font-black text-neutral-900 select-none">
                {quantity}
              </span>

              {/* Plus Button */}
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="w-8 h-8 rounded-xl bg-[#D81A07] hover:bg-[#b81505] text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>

            {/* Primary 'Add to Cart' Button with Repeating 2-Second Diagonal Shimmer */}
            <button
              type="button"
              onClick={handleAddAction}
              className="flex-1 py-3.5 px-4 sm:px-5 rounded-2xl bg-[#D81A07] hover:bg-[#b81505] text-white font-black text-sm sm:text-base flex items-center justify-between shadow-md relative overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
            >
              {/* Dynamic Price */}
              <span className="relative z-10 tracking-tight">
                Rs. {totalPrice.toLocaleString()}
              </span>

              {/* Divider */}
              <span className="relative z-10 text-white/50 text-xs sm:text-sm font-normal">
                |
              </span>

              {/* Add to Cart Label & Arrow */}
              <span className="relative z-10 flex items-center gap-1.5">
                <span>Add to Cart</span>
                <ArrowRight className="w-4 h-4 stroke-[2.8]" />
              </span>

              {/* Bright, vibrant diagonal shine beam gliding smoothly across button and text */}
              <div
                className="absolute inset-y-0 w-32 pointer-events-none bg-gradient-to-r from-transparent via-white/50 to-transparent animate-diagonal-shimmer z-20"
                style={{ filter: 'blur(1px)' }}
                aria-hidden="true"
              />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
