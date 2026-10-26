import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Flame,
  Check,
  ChevronRight,
} from 'lucide-react';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';

export type DynamicNotificationType = 'success' | 'info' | 'promo' | 'order' | 'warning' | 'pdp-glass';

export interface IDynamicNotification {
  id?: string;
  title: string;
  message?: string;
  avatar?: string;
  symbol?: string;
  type?: DynamicNotificationType;
  accent?: string;
  duration?: number | null; // ms, null for sticky
  onPress?: () => void;
  actionLabel?: string;
  render?: (notification: IDynamicNotification) => React.ReactNode;
  variant?: 'glass' | 'standard'; // All notifications now use the beautiful white glassmorphism look
}

interface DynamicNotificationsContextType {
  trigger: (notification: IDynamicNotification) => void;
  dismiss: (id?: string) => void;
  notifications: IDynamicNotification[];
}

const DynamicNotificationsContext = createContext<DynamicNotificationsContextType | undefined>(undefined);

export interface DynamicNotificationsProviderProps {
  children: React.ReactNode;
  duration?: number | null;
  accent?: string;
  onDismiss?: (notification: IDynamicNotification) => void;
}

export const DynamicNotificationsProvider: React.FC<DynamicNotificationsProviderProps> = ({
  children,
  duration = 4000,
  accent = '#D81A07', // Brand primary red
  onDismiss,
}) => {
  const [activeNotifications, setActiveNotifications] = useState<IDynamicNotification[]>([]);
  const timerMapRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismiss = useCallback(
    (id?: string) => {
      setActiveNotifications((prev) => {
        if (!id) {
          if (prev.length === 0) return prev;
          const [first, ...rest] = prev;
          const timer = timerMapRef.current.get(first.id || '');
          if (timer) clearTimeout(timer);
          timerMapRef.current.delete(first.id || '');
          onDismiss?.(first);
          return rest;
        }
        const timer = timerMapRef.current.get(id);
        if (timer) clearTimeout(timer);
        timerMapRef.current.delete(id);
        const item = prev.find((n) => n.id === id);
        if (item) onDismiss?.(item);
        return prev.filter((n) => n.id !== id);
      });
    },
    [onDismiss]
  );

  const trigger = useCallback(
    (notification: IDynamicNotification) => {
      const id = notification.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const notifWithId: IDynamicNotification = {
        ...notification,
        id,
        accent: notification.accent || accent,
      };

      // Clear any existing timer for this ID
      const existingTimer = timerMapRef.current.get(id);
      if (existingTimer) clearTimeout(existingTimer);

      setActiveNotifications((prev) => {
        return [notifWithId, ...prev.filter((n) => n.id !== id)].slice(0, 2);
      });

      const effectiveDuration = notification.duration !== undefined ? notification.duration : duration;
      if (effectiveDuration !== null && effectiveDuration > 0) {
        const timer = setTimeout(() => {
          dismiss(id);
        }, effectiveDuration);
        timerMapRef.current.set(id, timer);
      }
    },
    [accent, duration, dismiss]
  );

  useEffect(() => {
    return () => {
      timerMapRef.current.forEach((timer) => clearTimeout(timer));
      timerMapRef.current.clear();
    };
  }, []);

  return (
    <DynamicNotificationsContext.Provider value={{ trigger, dismiss, notifications: activeNotifications }}>
      {children}
      <DynamicNotificationTopBanner activeNotifications={activeNotifications} onDismiss={dismiss} />
    </DynamicNotificationsContext.Provider>
  );
};

export const useDynamicNotifications = (): DynamicNotificationsContextType => {
  const context = useContext(DynamicNotificationsContext);
  if (!context) {
    throw new Error('useDynamicNotifications must be used within a DynamicNotificationsProvider');
  }
  return context;
};

interface TopBannerProps {
  activeNotifications: IDynamicNotification[];
  onDismiss: (id?: string) => void;
}

const DynamicNotificationTopBanner: React.FC<TopBannerProps> = ({ activeNotifications, onDismiss }) => {
  return (
    <div
      className="fixed top-3 sm:top-5 left-0 right-0 z-9999 pointer-events-none flex flex-col items-center px-3 sm:px-4 space-y-2.5"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {activeNotifications.map((notif) => {
          const accentColor = notif.accent || '#D81A07';
          const isButtonless = notif.type === 'pdp-glass' || !notif.actionLabel;

          return (
            <motion.div
              key={notif.id}
              layout
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragEnd={(_e, info) => {
                // Swipe left or right beyond threshold dismisses it smoothly like native iOS/Android
                if (Math.abs(info.offset.x) > 70 || Math.abs(info.velocity.x) > 300) {
                  onDismiss(notif.id);
                }
              }}
              onClick={() => {
                if (notif.onPress) {
                  notif.onPress();
                }
              }}
              initial={{ opacity: 0, y: -45, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: -25,
                scale: 0.92,
                transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
              }}
              transition={{
                type: 'spring',
                stiffness: 440,
                damping: 30,
                mass: 0.8,
              }}
              role="status"
              className={`pointer-events-auto cursor-grab active:cursor-grabbing w-full max-w-sm sm:max-w-md bg-white/90 text-neutral-900 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.22),0_0_0_1px_rgba(255,255,255,0.85)] border border-white/70 flex items-center gap-3 select-none touch-pan-x transition-colors ${
                notif.onPress ? 'hover:bg-white/95 cursor-pointer' : ''
              }`}
              style={{
                WebkitBackdropFilter: 'blur(24px)',
                backdropFilter: 'blur(24px)',
              }}
            >
              {/* Left Element: Food Avatar or Styled Glass Pill Icon */}
              <div className="shrink-0 relative">
                {notif.avatar ? (
                  <div className="w-11 h-11 rounded-2xl overflow-hidden bg-neutral-100 border border-white/90 shadow-xs flex items-center justify-center">
                    <img
                      src={normalizeImageUrl(notif.avatar)}
                      alt=""
                      onError={handleImageError}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs"
                    style={{
                      backgroundColor: `${accentColor}15`,
                      color: accentColor,
                      border: `1.5px solid ${accentColor}35`,
                    }}
                  >
                    {notif.type === 'success' && <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />}
                    {notif.type === 'promo' && <Sparkles className="w-5 h-5 stroke-[2.5]" />}
                    {notif.type === 'order' && <ShoppingBag className="w-5 h-5 stroke-[2.5]" />}
                    {notif.type === 'warning' && <AlertCircle className="w-5 h-5 stroke-[2.5]" />}
                    {(!notif.type || notif.type === 'info') && <Flame className="w-5 h-5 stroke-[2.5]" />}
                  </div>
                )}
                {/* Status Dot / Mini Check */}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-[8px] font-black text-white"
                  style={{
                    backgroundColor:
                      notif.type === 'pdp-glass' || notif.type === 'success'
                        ? '#10B981'
                        : accentColor,
                  }}
                >
                  {(notif.type === 'pdp-glass' || notif.type === 'success') && (
                    <Check className="w-2 h-2 stroke-[4]" />
                  )}
                </span>
              </div>

              {/* Notification Text Body */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs sm:text-[13.5px] font-extrabold text-neutral-950 tracking-tight truncate leading-tight">
                    {notif.title}
                  </h4>
                  {notif.type === 'promo' && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-[#FFAE00] text-neutral-950 leading-none">
                      HOT DEAL
                    </span>
                  )}
                </div>
                {notif.message && (
                  <p className="text-[11px] sm:text-xs text-neutral-600 font-medium truncate mt-0.5 leading-snug">
                    {notif.message}
                  </p>
                )}
              </div>

              {/* Subtle Swipe Hint Bar for buttonless toasts */}
              {isButtonless && (
                <div
                  className="shrink-0 flex items-center pr-1 opacity-35"
                  title="Swipe to dismiss"
                >
                  <div className="w-1 h-5 rounded-full bg-neutral-400" />
                </div>
              )}

              {/* Action Button if specified (kept clean and compact in frosted glass theme) */}
              {!isButtonless && notif.actionLabel && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (notif.onPress) notif.onPress();
                    onDismiss(notif.id);
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-white shrink-0 shadow-xs cursor-pointer transition-transform active:scale-95 flex items-center gap-1"
                  style={{ backgroundColor: accentColor }}
                >
                  <span>{notif.actionLabel}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
