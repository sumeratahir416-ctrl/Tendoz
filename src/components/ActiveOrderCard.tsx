import React, { useState, useMemo } from 'react';
import { Clock, ChevronRight, Bike, Trash2, CheckCircle2, AlertTriangle, ChefHat, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../types';
import { normalizeImageUrl, handleImageError } from '../utils/imageUtils';

interface ActiveOrderCardProps {
  order: Order;
  onViewDetails: () => void;
  onCancelOrder?: (orderId: string) => Promise<void> | void;
  onDismiss?: () => void;
}

export const ActiveOrderCard: React.FC<ActiveOrderCardProps> = ({
  order,
  onViewDetails,
  onCancelOrder,
  onDismiss,
}) => {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Status-specific configuration
  const status = order.status;
  const isDeleted = status === 'Deleted Order' || status === 'Cancelled' || Boolean(order.isDeleted);
  const isWaiting = status === 'Waiting for Restaurant';
  const isPreparing = status === 'Preparing';
  const isOutForDelivery = status === 'Out for Delivery';
  const isDelivered = status === 'Delivered';

  // Keep Cancel Order enabled as long as status is not Preparing or beyond
  const canCancel = !isPreparing && !isOutForDelivery && !isDelivered && !isDeleted;

  // Calculate total items count
  const itemsCount =
    order.items && order.items.length > 0
      ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
      : 1;

  // Resolve product images for stacked avatar layout (up to 3 distinct items)
  const fallbackImage =
    'https://plain-eeur-prod-public.komododecks.com/202610/16/325VSCyY4RO4oqfL8mEq/image.webp';

  const itemImages = useMemo(() => {
    if (order.items && order.items.length > 0) {
      const imgs: string[] = [];
      for (const cartItem of order.items) {
        const img = cartItem.item?.image || (cartItem as any).image;
        if (img && !imgs.includes(img)) {
          imgs.push(img);
        }
        if (imgs.length >= 3) break;
      }
      if (imgs.length > 0) return imgs;
    }
    const firstImg = order.items?.[0]?.item?.image || (order.items?.[0] as any)?.image;
    return [firstImg || fallbackImage];
  }, [order.items]);

  // Dynamic status pill badge and subtitle text
  let statusBadgeText = 'ORDER PLACED SUCCESSFULLY';
  let statusSubtitle = 'Waiting for restaurant confirmation.';
  let badgeColor = 'bg-[#B91C1C] text-white';
  let badgeIcon = <Clock className="w-3.5 h-3.5 stroke-[2.8]" />;

  if (isDeleted) {
    statusBadgeText = 'DELETED ORDER';
    statusSubtitle = 'Deleted Order';
    badgeColor = 'bg-neutral-800 text-white';
    badgeIcon = <Trash2 className="w-3.5 h-3.5 stroke-[2.4]" />;
  } else if (isWaiting) {
    statusBadgeText = 'ORDER PLACED SUCCESSFULLY';
    statusSubtitle = 'Waiting for restaurant confirmation.';
    badgeColor = 'bg-[#B91C1C] text-white';
    badgeIcon = <Clock className="w-3.5 h-3.5 stroke-[2.8]" />;
  } else if (isPreparing) {
    statusBadgeText = 'PREPARING YOUR ORDER';
    statusSubtitle = 'Preparing Your Order';
    badgeColor = 'bg-[#D97706] text-white';
    badgeIcon = <ChefHat className="w-3.5 h-3.5 stroke-[2.8]" />;
  } else if (isOutForDelivery) {
    statusBadgeText = 'OUT FOR DELIVERY';
    statusSubtitle = 'Out for Delivery';
    badgeColor = 'bg-[#059669] text-white';
    badgeIcon = <Bike className="w-3.5 h-3.5 stroke-[2.8]" />;
  } else if (isDelivered) {
    statusBadgeText = 'ORDER DELIVERED';
    statusSubtitle = 'Order Delivered';
    badgeColor = 'bg-[#10B981] text-white';
    badgeIcon = <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.8]" />;
  }

  const deliveryLabel =
    order.orderType === 'Takeaway'
      ? 'Pickup (Main Branch)'
      : `Delivery (${order.address ? order.address.split(',')[0] : 'Sahiwal'})`;

  const orderNumber = order.id.startsWith('#') ? order.id : `#${order.id}`;

  const handleConfirmCancel = async () => {
    if (!onCancelOrder) return;
    setIsCancelling(true);
    try {
      await onCancelOrder(order.id);
      setIsConfirmingCancel(false);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.28 }}
        className="w-full bg-[#FFF9F8] border border-[#FCDAD7] rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 select-none relative overflow-hidden"
      >
        {/* Top Status Capsule Pill Badge */}
        <div className="flex items-center justify-between gap-2">
          <div
            className={`inline-flex items-center gap-1.5 ${badgeColor} text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs transition-colors`}
          >
            {badgeIcon}
            <span>{statusBadgeText}</span>
          </div>

          {/* Cancellation availability status chip */}
          {isWaiting && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-200">
              Cancellation Available
            </span>
          )}
          {(isPreparing || isOutForDelivery) && (
            <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200/80">
              In Progress &bull; Locked
            </span>
          )}
        </div>

        {/* Main Order Content Row: Overlapping/Stacked Product Avatars + Order Info */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Overlapping/Stacked Product Images Container */}
          <div className="flex items-center shrink-0 py-0.5 select-none">
            {itemImages.map((imgUrl, idx) => (
              <div
                key={idx}
                style={{ zIndex: 30 - idx * 10 }}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-neutral-200/90 overflow-hidden shrink-0 shadow-sm p-0.5 flex items-center justify-center transition-transform hover:scale-105 ${
                  idx > 0 ? '-ml-5 sm:-ml-6 ring-2 sm:ring-3 ring-white shadow-md' : ''
                }`}
              >
                <img
                  src={normalizeImageUrl(imgUrl)}
                  alt={order.itemName || `Ordered item ${idx + 1}`}
                  onError={handleImageError}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>

          {/* Dynamic Order Details */}
          <div className="min-w-0 flex-1">
            {/* Order Number */}
            <h3 className="font-black text-sm sm:text-base text-neutral-900 tracking-tight truncate">
              {orderNumber}
            </h3>

            {/* Subtitle Message with clear dynamic messaging */}
            <p className="text-xs sm:text-[13px] font-bold text-neutral-800 mt-0.5 leading-snug truncate">
              {statusSubtitle}
            </p>

            {/* Items count, Price, and Location */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-600 font-semibold mt-1">
              <span>
                {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
              </span>
              <span className="text-neutral-300">•</span>
              <span className="font-extrabold text-neutral-900">
                Rs. {(order.totalBill || order.total).toLocaleString()}
              </span>
              <span className="text-neutral-300">•</span>
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {deliveryLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 pt-1">
          {/* Primary View Order Details Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onViewDetails}
            className="flex-1 py-3 sm:py-3.5 px-4 bg-[#B91C1C] hover:bg-[#991B1B] active:bg-[#7F1D1D] text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <span>View Order Details</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </motion.button>

          {/* If Deleted Order or Delivered: Replace Cancel button with Dismiss button */}
          {(isDeleted || isDelivered) ? (
            onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="shrink-0 py-3 sm:py-3.5 px-4 sm:px-5 bg-neutral-800 hover:bg-neutral-900 active:bg-black text-white font-bold text-xs sm:text-sm rounded-2xl cursor-pointer transition-colors shadow-2xs flex items-center justify-center gap-1.5"
              >
                <span>Dismiss</span>
              </button>
            )
          ) : (
            /* Cancel Order Button (Active until Preparing) */
            <button
              type="button"
              disabled={!canCancel || isCancelling}
              onClick={() => {
                if (canCancel && !isCancelling) {
                  setIsConfirmingCancel(true);
                }
              }}
              title={
                canCancel
                  ? 'Cancel and delete this order'
                  : 'Order is being prepared in the kitchen and can no longer be cancelled'
              }
              className={`shrink-0 py-3 sm:py-3.5 px-3.5 sm:px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all border ${
                canCancel && !isCancelling
                  ? 'bg-white hover:bg-red-50 text-[#B91C1C] border-red-200 hover:border-red-400 cursor-pointer shadow-2xs active:scale-95'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-200/90 opacity-45 cursor-not-allowed select-none'
              }`}
            >
              <Trash2 className={`w-4 h-4 stroke-[2.2] ${canCancel ? 'text-[#B91C1C]' : 'text-neutral-400'}`} />
              <span className="inline">
                {isCancelling ? 'Deleting...' : canCancel ? 'Cancel Order' : 'Cancel (Disabled)'}
              </span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Confirmation Modal when Customer clicks Cancel Order */}
      <AnimatePresence>
        {isConfirmingCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isCancelling && setIsConfirmingCancel(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 space-y-4 border border-neutral-100 text-center"
            >
              <div className="w-12 h-12 bg-red-50 text-[#B91C1C] rounded-2xl flex items-center justify-center mx-auto border border-red-100">
                <AlertTriangle className="w-6 h-6 stroke-[2.4]" />
              </div>

              <div className="space-y-1">
                <h3 className="font-black text-lg text-neutral-900 tracking-tight">
                  Are you sure you want to delete order?
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed max-w-[270px] mx-auto">
                  Order <strong className="text-neutral-900">{orderNumber}</strong> will be cancelled and removed from restaurant preparation.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleConfirmCancel}
                  className="flex-1 py-3 px-4 bg-[#B91C1C] hover:bg-[#991B1B] text-white font-bold rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {isCancelling ? 'Deleting...' : 'Delete Order'}
                </button>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setIsConfirmingCancel(false)}
                  className="flex-1 py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Keep Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
