import React, { useState } from 'react';
import { X, Bell, Bike, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../../types';

interface SuccessModalProps {
  order?: Order | null;
  onClose: () => void;
  onNotifyMe?: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  order,
  onClose,
  onNotifyMe,
}) => {
  const [isRequestingNotification, setIsRequestingNotification] = useState(false);

  const handleNotifyMeClick = async () => {
    setIsRequestingNotification(true);
    try {
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
    } catch (e) {
      console.warn('Notification permission request:', e);
    }
    if (onNotifyMe) {
      onNotifyMe();
    } else {
      onClose();
    }
  };

  const orderNumber = order?.id ? (order.id.startsWith('#') ? order.id : `#${order.id}`) : '#AFC-0000026';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Blurred & Dimmed Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/65 backdrop-blur-md"
      />

      {/* Centered Modal Card matching Reference Image 1 Exactly */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[390px] bg-white rounded-[32px] sm:rounded-[36px] p-6 sm:p-7 shadow-2xl z-10 flex flex-col items-center text-center overflow-hidden border border-neutral-100"
      >
        {/* Top-Right Circular Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200/90 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.6]" />
        </button>

        {/* Top Centered Delivery Notification Icon Illustration */}
        <div className="relative mt-2 sm:mt-3 mb-4 sm:mb-5">
          {/* Main Red Rounded Squircle Container */}
          <div className="w-[84px] h-[84px] sm:w-[92px] sm:h-[92px] bg-[#B91C1C] rounded-[28px] sm:rounded-[30px] flex items-center justify-center shadow-lg shadow-red-700/25 relative">
            {/* Ringing Bell Icon */}
            <Bell className="w-10 h-10 sm:w-11 sm:h-11 text-white fill-white stroke-white" />

            {/* Sparkle Stars on Top-Right Corner */}
            <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center pointer-events-none">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[#FFAE00] drop-shadow-xs">
                <path
                  d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z"
                  fill="#FFAE00"
                />
              </svg>
            </div>
            <div className="absolute top-3.5 -right-2 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#FFAE00]">
                <path
                  d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z"
                  fill="#FFAE00"
                />
              </svg>
            </div>

            {/* Green Circular Badge with Delivery Bike at Bottom-Right Corner */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#10B981] border-2 border-white flex items-center justify-center shadow-xs">
              <Bike className="w-4 h-4 text-white stroke-[2.4]" />
            </div>
          </div>
        </div>

        {/* ORDER #AFC-0000026 Capsule Pill */}
        <div className="mb-2 sm:mb-2.5">
          <span className="inline-block bg-[#FEE2E2]/70 text-[#991B1B] font-black text-[11px] sm:text-xs tracking-wider uppercase px-4 py-1.5 rounded-full">
            ORDER {orderNumber}
          </span>
        </div>

        {/* Main Title Heading */}
        <h2 className="text-xl sm:text-[22px] font-black text-neutral-900 tracking-tight leading-snug mb-3">
          Get delivery updates!
        </h2>

        {/* Descriptive Body Text */}
        <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed max-w-[310px] mx-auto font-medium mb-6">
          Allow browser push notifications to get instant alerts the exact moment your order is{' '}
          <strong className="text-neutral-900 font-bold underline underline-offset-2">Out for Delivery</strong>
          . We&apos;ll let you know when your order is on the way
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 sm:space-y-3">
          {/* Primary Action Button: "Notify me" */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleNotifyMeClick}
            disabled={isRequestingNotification}
            className="w-full py-3.5 sm:py-4 px-6 bg-[#B91C1C] hover:bg-[#991B1B] active:bg-[#7F1D1D] text-white font-black text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-md shadow-red-900/20 cursor-pointer transition-all"
          >
            <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-white stroke-none" />
            <span>Notify me</span>
          </motion.button>

          {/* Secondary Dismiss Button: "Not now!" */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 sm:py-2.5 text-neutral-800 hover:text-neutral-950 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            Not now!
          </button>
        </div>
      </motion.div>
    </div>
  );
};
