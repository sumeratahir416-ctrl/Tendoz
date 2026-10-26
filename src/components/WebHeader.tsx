import React, { useState } from 'react';
import { MapPin, Phone, ShoppingCart, X, Check, Bell, ChevronRight } from 'lucide-react';
import { ScreenName } from '../types';
import { tendozBrandLogoImg } from '../data/initialData';

interface WebHeaderProps {
  currentScreen?: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  cartCount: number;
  wishlistCount?: number;
  onOpenCart?: () => void;
  onTriggerNotification?: () => void;
  selectedLocation?: {
    orderType: 'Delivery' | 'Pick-Up';
    area: string;
    branch: string;
  };
  onOpenLocationModal?: () => void;
}

export const WebHeader: React.FC<WebHeaderProps> = ({
  onNavigate,
  cartCount,
  onOpenCart,
  onTriggerNotification,
  selectedLocation,
  onOpenLocationModal,
}) => {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(
    'Tendoz Sahiwal, Near Pilot Girls School, Sahiwal, Punjab.'
  );

  const branches = [
    'Tendoz Sahiwal, Near Pilot Girls School, Sahiwal, Punjab.',
  ];

  return (
    <>
      <header className="w-full bg-white border-b border-neutral-200/80 shadow-2xs">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-3 sm:px-4 h-16 sm:h-[72px] relative flex items-center justify-between">
          {/* ========================================================= */}
          {/* MOBILE LEFT: Bell & Location Pin Button (< md untouched)  */}
          {/* ========================================================= */}
          <div className="flex md:hidden items-center gap-2 sm:gap-2.5 z-10 shrink-0">
            {/* Notification Bell Button */}
            {onTriggerNotification && (
              <button
                onClick={onTriggerNotification}
                title="Deals & Notifications"
                aria-label="Deals and Notifications"
                className="w-10 h-10 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/90 flex items-center justify-center text-neutral-800 transition-colors cursor-pointer shadow-2xs relative group"
              >
                <Bell className="w-4 h-4 stroke-[2.2] group-hover:text-[#D81A07] transition-colors" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#D81A07] ring-2 ring-white animate-pulse" />
              </button>
            )}

            {/* Location Pin Icon Button */}
            <button
              onClick={() => {
                if (onOpenLocationModal) {
                  onOpenLocationModal();
                } else {
                  setIsLocationOpen(true);
                }
              }}
              title={selectedLocation?.area ? `${selectedLocation.area}, Sahiwal` : 'Select Location'}
              aria-label="Restaurant Location"
              className="w-10 h-10 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/90 flex items-center justify-center text-neutral-800 transition-colors cursor-pointer shadow-2xs"
            >
              <MapPin className="w-4 h-4 stroke-[2.2] text-[#D81A07]" />
            </button>
          </div>

          {/* ========================================================= */}
          {/* DESKTOP LEFT: Reference Design Capsule Buttons (md:flex)  */}
          {/* ========================================================= */}
          <div className="hidden md:flex items-center gap-2.5 z-10 shrink-0">
            {/* 1. Pickup / Delivery Location Capsule Pill */}
            <button
              onClick={() => {
                if (onOpenLocationModal) {
                  onOpenLocationModal();
                } else {
                  setIsLocationOpen(true);
                }
              }}
              title="Select Delivery Area / Pickup Branch"
              aria-label="Location Selection"
              className="h-9 px-3.5 rounded-full bg-neutral-100/90 hover:bg-neutral-200/80 border border-neutral-200/90 flex items-center gap-1.5 text-neutral-800 transition-all cursor-pointer shadow-2xs group"
            >
              <MapPin className="w-3.5 h-3.5 stroke-[2.4] text-[#D81A07] shrink-0" />
              <span className="text-[10px] font-black tracking-wider text-[#D81A07] uppercase">
                {selectedLocation?.orderType === 'Pick-Up' ? 'PICKUP' : 'DELIVERY'}
              </span>
              <span className="text-xs font-bold text-neutral-800 truncate max-w-[130px] lg:max-w-[180px]">
                {selectedLocation?.area || 'Select Area'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5] text-neutral-400 group-hover:text-neutral-700 transition-colors shrink-0" />
            </button>

            {/* 2. Order Hotline Capsule Pill */}
            <button
              onClick={() => setIsPhoneOpen(true)}
              title="Order Hotline: 0320 0089000"
              aria-label="Order Hotline: 0320 0089000"
              className="h-9 px-3.5 rounded-full bg-neutral-100/90 hover:bg-neutral-200/80 border border-neutral-200/90 flex items-center gap-2 text-neutral-800 transition-all cursor-pointer shadow-2xs group"
            >
              <Phone className="w-3.5 h-3.5 stroke-[2.4] text-neutral-600 group-hover:text-[#D81A07] transition-colors shrink-0" />
              <span className="text-xs font-bold text-neutral-800 tracking-tight">
                0320 0089000
              </span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* CENTER BRANDING: Shape & Position from Reference Image     */}
          {/* ========================================================= */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center pointer-events-none">
            <div
              className="flex items-center justify-center select-none cursor-default"
              title="Tendoz Restaurant"
              aria-label="Tendoz Restaurant Logo"
            >
              {/* Mobile: 45px box container (untouched) */}
              <div className="flex md:hidden w-[45px] h-[45px] rounded-xl overflow-hidden items-center justify-center bg-white border border-neutral-200/90 shadow-2xs select-none">
                <img
                  src={tendozBrandLogoImg}
                  alt="Tendoz Logo"
                  className="w-full h-full object-contain select-none"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Desktop: Logo Badge with yellow background removed */}
              <div className="hidden md:flex w-13 h-13 lg:w-15 lg:h-15 rounded-full bg-white border border-neutral-200/80 shadow-2xs items-center justify-center p-1.5 overflow-hidden select-none">
                <img
                  src={tendozBrandLogoImg}
                  alt="Tendoz Logo"
                  className="w-full h-full object-contain select-none"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT: Header buttons consistent with reference design     */}
          {/* ========================================================= */}
          {/* Mobile Right (< md untouched) */}
          <div className="flex md:hidden items-center gap-2 sm:gap-2.5 z-10 shrink-0">
            {/* Order Hotline Button */}
            <button
              onClick={() => setIsPhoneOpen(true)}
              title="Order Hotline"
              aria-label="Order Hotline"
              className="w-10 h-10 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/90 flex items-center justify-center text-neutral-800 transition-colors cursor-pointer shadow-2xs"
            >
              <Phone className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => {
                if (onOpenCart) {
                  onOpenCart();
                } else {
                  onNavigate('cart');
                }
              }}
              title="Shopping Cart"
              aria-label="Shopping Cart"
              className="w-10 h-10 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/90 flex items-center justify-center text-neutral-800 transition-colors cursor-pointer shadow-2xs relative"
            >
              <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D81A07] text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop Right (md:flex - consistent with reference design) */}
          <div className="hidden md:flex items-center gap-2.5 z-10 shrink-0">
            {onTriggerNotification && (
              <button
                onClick={onTriggerNotification}
                title="Deals & Notifications"
                aria-label="Deals and Notifications"
                className="w-10 h-10 rounded-full bg-neutral-100/90 hover:bg-neutral-200/80 border border-neutral-200/90 flex items-center justify-center text-neutral-800 transition-all cursor-pointer shadow-2xs relative group"
              >
                <Bell className="w-4 h-4 stroke-[2.2] group-hover:text-[#D81A07] transition-colors" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#D81A07] ring-2 ring-white animate-pulse" />
              </button>
            )}

            <button
              onClick={() => {
                if (onOpenCart) {
                  onOpenCart();
                } else {
                  onNavigate('cart');
                }
              }}
              title="Shopping Cart"
              aria-label="Shopping Cart"
              className="w-10 h-10 rounded-full bg-neutral-100/90 hover:bg-neutral-200/80 border border-neutral-200/90 flex items-center justify-center text-neutral-800 transition-all cursor-pointer shadow-2xs relative hover:scale-105 active:scale-95"
            >
              <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D81A07] text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Location Modal */}
      {isLocationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => setIsLocationOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-[#D81A07] border border-red-200/60 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-neutral-900 leading-tight">
                  Restaurant Location
                </h3>
                <p className="text-[11px] text-neutral-500 font-medium">
                  Sahiwal Branch (Dine-in, Takeaway & Delivery)
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {branches.map((branch) => (
                <button
                  key={branch}
                  onClick={() => {
                    setSelectedBranch(branch);
                    setIsLocationOpen(false);
                  }}
                  className={`w-full p-3.5 rounded-2xl text-left text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                    selectedBranch === branch
                      ? 'border-[#D81A07] bg-red-50/70 text-neutral-950 font-bold'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <span className="leading-snug">{branch}</span>
                  {selectedBranch === branch && (
                    <Check className="w-4 h-4 text-[#D81A07] shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Tendoz+Sahiwal+Near+Pilot+Girls+School+Sahiwal+Punjab"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block w-full py-2.5 px-4 rounded-2xl text-center text-xs font-bold text-[#D81A07] bg-red-50 hover:bg-red-100 border border-red-200/70 transition-colors cursor-pointer"
            >
              📍 Open in Google Maps
            </a>
          </div>
        </div>
      )}

      {/* Hotline Modal */}
      {isPhoneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setIsPhoneOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200/60 flex items-center justify-center mx-auto mb-3 shadow-2xs text-[#D81A07]">
              <Phone className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="font-black text-lg text-neutral-900">
              Direct Order Hotline
            </h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              Call our kitchen directly for rapid dine-in reservations or takeout
            </p>

            <a
              href="tel:03200089000"
              className="block w-full py-3.5 bg-[#D81A07] hover:bg-[#bd1605] active:bg-[#a21204] text-white font-black rounded-2xl transition-all shadow-md shadow-red-600/20 text-base cursor-pointer"
            >
              📞 03200089000
            </a>
          </div>
        </div>
      )}
    </>
  );
};
