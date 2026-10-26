import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Flame,
  Bike,
  MapPin,
  Phone,
  ChefHat,
  Trash2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../../types';

interface OrderTrackingModalProps {
  order: Order;
  onClose: () => void;
  onBackToHome: () => void;
  onCancelOrder?: (orderId: string) => Promise<void> | void;
  onDismiss?: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  onClose,
  onBackToHome,
  onCancelOrder,
  onDismiss,
}) => {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const status = order.status;
  const isDeleted = status === 'Deleted Order' || status === 'Cancelled' || Boolean(order.isDeleted);
  const isWaiting = status === 'Waiting for Restaurant';
  const isPreparing = status === 'Preparing';
  const isOutForDelivery = status === 'Out for Delivery';
  const isDelivered = status === 'Delivered';

  // Keep Cancel Order enabled as long as status is not Preparing or beyond
  const canCancel = !isPreparing && !isOutForDelivery && !isDelivered && !isDeleted;

  const steps = [
    {
      title: 'Order Received & Verified',
      time: 'Confirmed',
      done: true,
      active: isWaiting,
      icon: Clock,
    },
    {
      title: 'Preparing Your Order',
      time: isPreparing ? 'In Progress' : isOutForDelivery || isDelivered ? 'Completed' : 'Upcoming',
      done: isPreparing || isOutForDelivery || isDelivered,
      active: isPreparing,
      icon: ChefHat,
    },
    {
      title: 'Out for Delivery',
      time: isOutForDelivery ? 'On the Way' : isDelivered ? 'Completed' : 'Upcoming',
      done: isOutForDelivery || isDelivered,
      active: isOutForDelivery,
      icon: Bike,
    },
    {
      title: 'Order Delivered',
      time: isDelivered ? 'Delivered' : 'Upcoming',
      done: isDelivered,
      active: isDelivered,
      icon: CheckCircle,
    },
  ];

  const handleCancelClick = async () => {
    if (!canCancel || !onCancelOrder) return;
    setIsCancelling(true);
    try {
      await onCancelOrder(order.id);
      setIsConfirmingCancel(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const orderNumber = order.id.startsWith('#') ? order.id : `#${order.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#D81A07] fill-[#D81A07]" />
            <h3 className="font-black text-lg text-neutral-900">
              Live Kitchen Tracking
            </h3>
          </div>

          {/* Overlapping/Stacked Product Avatars in Tracking Modal */}
          {order.items && order.items.length > 0 && (
            <div className="flex items-center shrink-0">
              {order.items.slice(0, 3).map((cartItem: any, idx: number) => {
                const img = cartItem.item?.image || cartItem.image;
                if (!img) return null;
                return (
                  <div
                    key={idx}
                    style={{ zIndex: 30 - idx * 10 }}
                    className={`w-10 h-10 rounded-xl bg-white border border-neutral-200 overflow-hidden shrink-0 shadow-2xs p-0.5 ${
                      idx > 0 ? '-ml-3.5 ring-2 ring-white' : ''
                    }`}
                  >
                    <img
                      src={img}
                      alt="Ordered item"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <p className="text-xs text-neutral-500 font-mono mb-3">
          Order {orderNumber} • {order.itemName}
        </p>

        {/* Cancellation status badge */}
        {isDeleted ? (
          <div className="mb-4 p-3 bg-neutral-900 text-white rounded-2xl flex items-center gap-2.5 text-xs font-bold">
            <Trash2 className="w-4 h-4 shrink-0 text-red-400" />
            <div>
              <div className="uppercase tracking-wider text-[11px] text-red-400 font-black">Deleted Order</div>
              <div className="text-neutral-300 text-[11px] font-normal">Order was cancelled by customer</div>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <span
              className={`inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                isWaiting
                  ? 'bg-amber-100 text-amber-800'
                  : isPreparing
                  ? 'bg-orange-100 text-orange-800'
                  : isOutForDelivery
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isWaiting
                ? 'Waiting for Restaurant Confirmation'
                : isPreparing
                ? 'Preparing Your Order'
                : isOutForDelivery
                ? 'Out for Delivery'
                : 'Order Delivered'}
            </span>
          </div>
        )}

        {/* Tracking Timeline */}
        <div className="space-y-4 my-5 pl-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="flex items-start gap-3.5 relative">
                {idx !== steps.length - 1 && (
                  <div
                    className={`absolute left-3.5 top-7 w-0.5 h-8 -ml-px ${
                      step.done ? 'bg-[#D81A07]' : 'bg-neutral-200'
                    }`}
                  />
                )}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                    step.active
                      ? 'bg-[#D81A07] text-white font-bold ring-4 ring-[#D81A07]/20 shadow-xs'
                      : step.done
                      ? 'bg-red-50 text-[#D81A07]'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-xs font-bold ${
                        step.active ? 'text-[#D81A07] font-extrabold' : 'text-neutral-900'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {step.time}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Exact Product Order Details & Add-Ons Breakdown */}
        {order.items && order.items.length > 0 && (
          <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-100 space-y-2 mb-3.5">
            <div className="text-xs font-black text-neutral-900 border-b border-neutral-200/80 pb-1.5 flex items-center justify-between">
              <span>
                Ordered Items ({order.items.reduce((sum, i: any) => sum + (i.quantity || 1), 0)})
              </span>
              <span className="text-[#D81A07]">
                Rs. {(order.totalBill || order.total).toLocaleString()}
              </span>
            </div>
            <div className="divide-y divide-neutral-200/50 space-y-2 pt-1">
              {order.items.map((cartItem: any, idx: number) => {
                const itemObj = cartItem.item || cartItem;
                const rawName = itemObj.name || cartItem.name || 'Menu Item';
                const category = itemObj.category || cartItem.category || '';
                const tag = itemObj.tag || cartItem.tag || '';
                const isDeal =
                  category.toLowerCase().includes('deal') ||
                  rawName.toLowerCase().includes('deal') ||
                  tag.toLowerCase().includes('deal');

                const name = isDeal && !rawName.includes('(Deal)') ? `${rawName} (Deal)` : rawName;
                const qty = cartItem.quantity || 1;
                const price = cartItem.unitPrice || itemObj.price || cartItem.price || 0;
                const addOns = cartItem.addOns || [];
                const size = cartItem.selectedSize;
                const notes = cartItem.notes;

                return (
                  <div key={idx} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-neutral-900 leading-snug">
                        {qty}x {name} {size ? `(${size})` : ''}
                      </div>
                      {addOns.length > 0 && (
                        <div className="text-[11px] text-[#D81A07] font-semibold mt-0.5">
                          Add-ons: {addOns.join(', ')}
                        </div>
                      )}
                      {notes && (
                        <div className="text-[11px] text-neutral-500 italic mt-0.5">
                          Note: "{notes}"
                        </div>
                      )}
                    </div>
                    <div className="font-black text-neutral-900 shrink-0">
                      Rs. {(price * qty).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Delivery Address & Customer Details */}
        <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-100 space-y-2 mb-4">
          <div className="flex items-start gap-2 text-xs text-neutral-600">
            <MapPin className="w-4 h-4 text-[#D81A07] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-semibold text-neutral-900 block">{order.customerName}</span>
              <span className="text-neutral-500">{order.address}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600 pt-1 border-t border-neutral-200/60">
            <Phone className="w-3.5 h-3.5 text-neutral-400" />
            <span>{order.phone}</span>
            {order.additionalPhone && (
              <span className="text-neutral-400 text-[11px]">
                (Alt: {order.additionalPhone})
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Cancel Order / Dismiss & Back to Menu */}
        <div className="space-y-2.5">
          {isDeleted ? (
            <button
              type="button"
              onClick={() => {
                if (onDismiss) onDismiss();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all bg-neutral-900 hover:bg-black text-white cursor-pointer shadow-md active:scale-98"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>Dismiss</span>
            </button>
          ) : isDelivered ? (
            <button
              type="button"
              onClick={() => {
                if (onDismiss) onDismiss();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md active:scale-98"
            >
              <CheckCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Dismiss</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!canCancel || isCancelling}
              onClick={() => {
                if (canCancel) {
                  setIsConfirmingCancel(true);
                }
              }}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${
                canCancel
                  ? 'bg-red-50 hover:bg-red-100 text-[#B91C1C] border-red-200 hover:border-red-300 cursor-pointer shadow-xs active:scale-98'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-200/80 opacity-50 cursor-not-allowed select-none'
              }`}
            >
              <Trash2 className="w-4 h-4 stroke-[2]" />
              <span>
                {isCancelling
                  ? 'Cancelling...'
                  : canCancel
                  ? 'Cancel Order'
                  : 'Cancel Order (Locked in Kitchen)'}
              </span>
            </button>
          )}

          <button
            onClick={onBackToHome}
            className="w-full py-3 px-4 bg-[#D81A07] hover:bg-[#b81505] text-white font-bold rounded-2xl transition-all shadow-md shadow-[#D81A07]/25 cursor-pointer text-xs"
          >
            Back to Tendoz Menu
          </button>
        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {isConfirmingCancel && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isCancelling && setIsConfirmingCancel(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="relative w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl z-20 space-y-3.5 border border-neutral-100 text-center"
              >
                <div className="w-11 h-11 bg-red-50 text-[#B91C1C] rounded-2xl flex items-center justify-center mx-auto border border-red-100">
                  <AlertTriangle className="w-5 h-5 stroke-[2.4]" />
                </div>
                <h4 className="font-black text-base text-neutral-900">
                  Are you sure you want to delete order?
                </h4>
                <p className="text-xs text-neutral-600">
                  Order {orderNumber} will be cancelled and removed from restaurant preparation.
                </p>
                <div className="pt-1 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={handleCancelClick}
                    className="w-full py-2.5 px-4 bg-[#B91C1C] hover:bg-[#991B1B] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {isCancelling ? 'Deleting...' : 'Delete Order'}
                  </button>
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={() => setIsConfirmingCancel(false)}
                    className="w-full py-2 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Keep Order
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
