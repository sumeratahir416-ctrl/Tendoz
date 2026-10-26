import React, { useRef, useMemo, useEffect, useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ReceiptText,
  Truck,
  UtensilsCrossed,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, MenuItem } from '../../types';
import { POPULAR_COMPANIONS } from '../../data/initialData';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: (item?: MenuItem) => void;
  onExplore: () => void;
  onAddToCart: (item: MenuItem, quantity?: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onExplore,
  onAddToCart,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (itemToDelete) {
          setItemToDelete(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, itemToDelete]);

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Financial calculations with Free Delivery (tax removed)
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, cartItem) =>
          sum + (cartItem.unitPrice ?? cartItem.item.price) * cartItem.quantity,
        0
      ),
    [items]
  );
  const grandTotal = subtotal;

  // Compute dynamic pickup time estimation (45 minutes ahead)
  const pickupInfo = useMemo(() => {
    const now = new Date();
    const pickup = new Date(now.getTime() + 45 * 60 * 1000);

    const day = pickup.getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? 'st'
        : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
        ? 'rd'
        : 'th';

    const month = pickup.toLocaleDateString('en-US', { month: 'long' });
    const year = pickup.getFullYear();
    const formattedDate = `${month} ${day}${suffix}, ${year}`;

    let hours = pickup.getHours();
    const minutes = pickup.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    const strHours = hours < 10 ? '0' + hours : hours;
    const formattedTime = `${strHours}:${strMinutes} ${ampm}`;

    return { formattedDate, formattedTime };
  }, []);

  const handleScrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleProceedCheckout = () => {
    if (items.length > 0) {
      onCheckout(items[0].item);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Fluid Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Slide-over Drawer / Mobile Fullsheet */}
          <div className="fixed inset-y-0 right-0 max-w-full flex">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-screen max-w-full sm:max-w-md md:max-w-lg bg-[#F8F9FA] flex flex-col shadow-2xl relative z-10 h-full max-h-screen"
            >
              {/* 1. TOP HEADER (Solid Brand Red, Shopping Bag Icon, 'Your Cart', Circular Close 'X' Button - clean, no divider line or shadow) */}
              <div className="bg-[#D81A07] text-white px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shrink-0 border-none shadow-none">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    Your Cart
                  </h2>
                </div>

                {/* Circular Close Button with subtle translucent background matching screenshot */}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close Cart"
                  title="Close Cart"
                  className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.8]" />
                </button>
              </div>

              {/* 2. SCROLLABLE CART CONTENT BODY */}
              <div className="flex-1 overflow-y-auto px-3.5 sm:px-4 pt-3 pb-4 space-y-2.5 no-scrollbar min-h-0">
                {items.length === 0 ? (
                  /* Empty Cart View */
                  <div className="text-center py-12 px-4 bg-white rounded-2xl border border-neutral-200/80 shadow-xs my-3 space-y-3">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-[#D81A07]">
                      <UtensilsCrossed className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-neutral-900">Your cart is empty</h3>
                      <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                        Explore our crispy chicken broast, smash burgers, and loaded fries!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onExplore();
                      }}
                      className="py-2.5 px-5 bg-[#D81A07] hover:bg-[#b81505] active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-red-600/20"
                    >
                      + Browse Tendoz Menu
                    </button>
                  </div>
                ) : (
                  <>
                    {/* CART ITEMS LIST (White rounded cards matching reference screenshot) */}
                    <div className="space-y-2">
                      {items.map((cartItem, idx) => {
                        const isSingle = cartItem.quantity === 1;
                        const itemUnitPrice = cartItem.unitPrice ?? cartItem.item.price;
                        const itemTotal = itemUnitPrice * cartItem.quantity;
                        const itemIdentifier = cartItem.id || cartItem.item.id;

                        return (
                          <div
                            key={cartItem.id || `${cartItem.item.id}-${idx}`}
                            className="bg-white rounded-2xl p-2.5 sm:p-3 border border-neutral-200/60 shadow-2xs flex items-center justify-between gap-2.5 hover:border-neutral-300/80 transition-colors"
                          >
                            {/* Food Photo + Titles */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200/80 shadow-2xs">
                                <img
                                  src={normalizeImageUrl(cartItem.item.image)}
                                  alt={cartItem.item.name}
                                  onError={handleImageError}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="min-w-0">
                                {(() => {
                                  const rawName = cartItem.item.name;
                                  const category = (cartItem.item.category || '').toString().toLowerCase();
                                  const tag = (cartItem.item.tag || '').toString().toLowerCase();
                                  const isDeal = category.includes('deal') || rawName.toLowerCase().includes('deal') || tag.includes('deal');
                                  const displayName = isDeal && !rawName.includes('(Deal)') ? `${rawName} (Deal)` : rawName;

                                  return (
                                    <h4 className="font-bold text-[13px] sm:text-[14px] text-neutral-900 truncate leading-snug">
                                      {displayName}
                                    </h4>
                                  );
                                })()}

                                {/* Customizations & Add-Ons Display */}
                                {cartItem.addOns && cartItem.addOns.length > 0 ? (
                                  <p className="text-[11px] text-neutral-600 font-medium truncate leading-tight mt-0.5">
                                    <span className="text-[#D81A07] font-bold">+ Extras:</span>{' '}
                                    {cartItem.addOns.join(', ')}
                                  </p>
                                ) : cartItem.selectedDip ? (
                                  <p className="text-[11px] text-neutral-400 truncate leading-tight">
                                    {cartItem.selectedDip}
                                  </p>
                                ) : null}

                                {/* Notes if any */}
                                {cartItem.notes && (
                                  <p className="text-[10px] text-neutral-400 italic truncate leading-tight">
                                    Note: {cartItem.notes}
                                  </p>
                                )}

                                {/* Price with unit breakdown */}
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                  <span className="font-bold text-xs sm:text-[13px] text-[#D81A07]">
                                    Rs. {itemTotal.toLocaleString()}
                                  </span>
                                  {cartItem.quantity > 1 && (
                                    <span className="text-[10px] text-neutral-400 font-medium">
                                      (Rs. {itemUnitPrice.toLocaleString()} each)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Stepper capsule and delete button */}
                            <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
                              <div className="flex items-center gap-2 sm:gap-2.5 bg-neutral-50/90 border border-neutral-200/90 rounded-full px-2.5 py-1 shadow-2xs">
                                {/* Quantity Decrease or Trash if count is 1 */}
                                {isSingle ? (
                                  <button
                                    type="button"
                                    onClick={() => onRemoveItem(itemIdentifier)}
                                    className="text-[#D81A07] hover:scale-110 active:scale-90 transition-transform cursor-pointer p-0.5"
                                    title="Delete item"
                                    aria-label="Delete item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (cartItem.quantity === 1) {
                                        onRemoveItem(itemIdentifier);
                                      } else {
                                        onUpdateQuantity(itemIdentifier, -1);
                                      }
                                    }}
                                    className="text-[#D81A07] hover:scale-110 active:scale-90 transition-transform cursor-pointer p-0.5"
                                    title="Decrease quantity"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="w-3 h-3 stroke-[2.8]" />
                                  </button>
                                )}

                                {/* Quantity Count (Red & Bold in reference) */}
                                <span className="font-bold text-xs sm:text-sm text-[#D81A07] min-w-[14px] text-center select-none">
                                  {cartItem.quantity}
                                </span>

                                {/* Quantity Increase */}
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(itemIdentifier, 1)}
                                  className="text-[#D81A07] hover:scale-110 active:scale-90 transition-transform cursor-pointer p-0.5"
                                  title="Increase quantity"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              </div>

                              {/* Dedicated Delete Icon Button on every Cart item */}
                              <button
                                type="button"
                                onClick={() => onRemoveItem(itemIdentifier)}
                                className="p-1 sm:p-1.5 text-neutral-400 hover:text-[#D81A07] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete item from cart"
                                aria-label={`Delete ${cartItem.item.name} from cart`}
                              >
                                <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* '+ Add more items' Dashed Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onExplore();
                      }}
                      className="w-full border border-dashed border-[#FCA5A5] bg-[#FFF5F5]/40 hover:bg-[#FEF2F2] active:scale-[0.99] text-[#D81A07] font-bold text-xs sm:text-[13px] py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
                      <span>Add more items</span>
                    </button>

                    {/* '🔥 Popular with your order' Carousel Header & Horizontal Cards */}
                    <div className="pt-0.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-[#D81A07] fill-[#D81A07]" />
                          <h3 className="font-bold text-xs sm:text-sm text-neutral-900 tracking-tight">
                            Popular with your order
                          </h3>
                        </div>

                        {/* Navigation Arrows */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleScrollCarousel('left')}
                            className="w-5 h-5 rounded-full bg-[#FEE2E2] hover:bg-red-200 text-[#F87171] hover:text-[#D81A07] flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Scroll left"
                          >
                            <ChevronLeft className="w-3 h-3 stroke-[2.8]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleScrollCarousel('right')}
                            className="w-5 h-5 rounded-full bg-[#D81A07] text-white hover:bg-[#b81505] flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Scroll right"
                          >
                            <ChevronRight className="w-3 h-3 stroke-[2.8]" />
                          </button>
                        </div>
                      </div>

                      {/* Horizontal Scrolling Items */}
                      <div
                        ref={carouselRef}
                        className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1.5 scroll-smooth no-scrollbar"
                      >
                        {POPULAR_COMPANIONS.map((companion) => (
                          <div
                            key={companion.id}
                            className="w-[72px] sm:w-[80px] shrink-0 flex flex-col group select-none"
                          >
                            <div className="relative w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-2xs">
                              <img
                                src={normalizeImageUrl(companion.image)}
                                alt={companion.name}
                                onError={handleImageError}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                referrerPolicy="no-referrer"
                              />
                              <button
                                type="button"
                                onClick={() => onAddToCart(companion, 1)}
                                title={`Add ${companion.name}`}
                                aria-label={`Add ${companion.name}`}
                                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#D81A07] hover:bg-[#b81505] active:scale-90 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform"
                              >
                                <Plus className="w-3 h-3 stroke-[3]" />
                              </button>
                            </div>
                            <span className="font-bold text-xs text-neutral-900 mt-1 leading-tight">
                              Rs. {companion.price}
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-neutral-500 font-medium truncate leading-tight mt-0.5">
                              {companion.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ORDER SUMMARY CARD (Total, Tax 16%, *Pay online & enjoy 8% tax only, Grand Total) */}
                    <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-neutral-200/70 shadow-2xs space-y-2">
                      {/* Total Line */}
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-neutral-800 font-bold">
                          <div className="w-5 h-5 rounded-md bg-red-50 text-[#D81A07] flex items-center justify-center">
                            <Receipt className="w-3 h-3" />
                          </div>
                          <span>Total</span>
                        </div>
                        <span className="font-bold text-neutral-900">Rs. {subtotal.toLocaleString()}</span>
                      </div>

                      {/* Free Delivery Line */}
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-neutral-800 font-bold">
                          <div className="w-5 h-5 rounded-md bg-red-50 text-[#D81A07] flex items-center justify-center">
                            <Truck className="w-3 h-3 stroke-[2.4]" />
                          </div>
                          <span>Free Delivery</span>
                        </div>
                        <span className="font-bold text-neutral-900">Free</span>
                      </div>

                      {/* Grand Total Line */}
                      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                        <span className="text-sm sm:text-base font-black text-neutral-900">
                          Grand Total
                        </span>
                        <span className="text-base sm:text-lg font-black text-[#D81A07]">
                          Rs. {grandTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 3. STICKY BOTTOM CHECKOUT SECTION (Sticky & fixed while scrolling, with matching sliding shine animation) */}
              {items.length > 0 && (
                <div className="shrink-0 border-t border-neutral-200/80 bg-white/95 backdrop-blur-md px-3.5 sm:px-4 pt-2.5 pb-2.5 sm:pb-3 shadow-[0_-6px_25px_rgba(0,0,0,0.06)] z-20 space-y-1.5">
                  {/* BIG CHECKOUT BUTTON with Sliding Shine Effect matching PDP Add to Cart */}
                  <button
                    type="button"
                    onClick={handleProceedCheckout}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white px-3.5 py-2.5 sm:py-3 rounded-2xl shadow-md shadow-red-600/25 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
                  >
                    {/* Left: Grand Total Label & Value */}
                    <div className="relative z-10 text-left">
                      <div className="text-[11px] sm:text-xs font-semibold text-white/90">
                        Grand Total
                      </div>
                      <div className="text-sm sm:text-base font-black text-white leading-tight">
                        Rs. {grandTotal}
                      </div>
                    </div>

                    {/* Right: Checkout CTA & Arrow */}
                    <div className="relative z-10 flex items-center gap-1.5 text-sm sm:text-base font-black text-white">
                      <span>Checkout</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.8]" />
                    </div>

                    {/* Bright, vibrant sliding shine beam gliding smoothly across Checkout button matching PDP speed, duration, timing, & opacity */}
                    <div
                      className="absolute inset-y-0 w-32 pointer-events-none bg-gradient-to-r from-transparent via-white/50 to-transparent animate-diagonal-shimmer z-20"
                      style={{ filter: 'blur(1px)' }}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Subtext / Details below Checkout button (Pickup estimation info) */}
                  <div className="text-center pt-0.5 space-y-0.5">
                    <p className="text-[11px] sm:text-xs font-semibold text-neutral-600">
                      Your order will be ready for Pickup in 45 minutes on
                    </p>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold text-neutral-800">
                      <span>{pickupInfo.formattedDate}</span>
                      <span className="font-medium text-neutral-400">at</span>
                      <span className="bg-[#FEE2E2] text-[#D81A07] px-2 py-0.5 rounded-md font-bold text-[11px] sm:text-xs tracking-wide">
                        {pickupInfo.formattedTime}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Cart Item Deletion Confirmation Popup Modal */}
          <AnimatePresence>
            {itemToDelete && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setItemToDelete(null)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                />

                {/* Modal Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 15 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                  className="w-full max-w-[340px] bg-white rounded-3xl p-5 shadow-2xl relative text-center border border-neutral-100 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close 'X' Button */}
                  <button
                    type="button"
                    onClick={() => setItemToDelete(null)}
                    className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  {/* Soft Red Emblem with Trash Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#D81A07] border border-red-100/80 flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Trash2 className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  {/* Modal Title & Subtitle */}
                  <h3 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                    Remove from Cart?
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-normal px-2">
                    Are you sure you want to remove this dish from your order?
                  </p>

                  {/* Item Details Preview Card */}
                  <div className="my-3.5 bg-neutral-50 rounded-2xl p-2.5 border border-neutral-200/70 flex items-center gap-2.5 text-left">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200/80">
                      <img
                        src={normalizeImageUrl(itemToDelete.item.image)}
                        alt={itemToDelete.item.name}
                        onError={handleImageError}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs sm:text-[13px] text-neutral-900 truncate">
                        {itemToDelete.item.name}
                      </h4>
                      {itemToDelete.selectedDip && (
                        <p className="text-[10px] text-neutral-400 truncate">
                          {itemToDelete.selectedDip}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-bold text-xs text-[#D81A07]">
                          Rs. {((itemToDelete.unitPrice ?? itemToDelete.item.price) * itemToDelete.quantity).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-200/70 px-1.5 py-0.5 rounded-md">
                          Qty: {itemToDelete.quantity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Cancel and Remove */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setItemToDelete(null)}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-neutral-200 bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onRemoveItem(itemToDelete.id || itemToDelete.item.id);
                        setItemToDelete(null);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#D81A07] hover:bg-[#b81505] active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Remove</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};
