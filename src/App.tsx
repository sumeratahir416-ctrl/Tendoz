import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenName, MenuItem, Order, CartItem, AdminStats, PizzaSize } from './types';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_STATS,
  tendozBrandLogoImg,
  carouselBanner1Img,
  carouselBanner2Img,
  carouselBanner3Img,
} from './data/initialData';
import { WebHeader } from './components/WebHeader';
import { HomeScreen } from './components/screens/HomeScreen';
import { Footer } from './components/Footer';
import { AppLaunchSkeleton } from './components/AppLaunchSkeleton';
import { LocationSelectionModal, UserLocationSelection } from './components/LocationSelectionModal';

// Code-split secondary screens and modals to reduce main-thread JS parse time and payload
const NewMenuScreen = React.lazy(() =>
  import('./components/screens/NewMenuScreen').then((m) => ({ default: m.NewMenuScreen }))
);
const ProductDetailModal = React.lazy(() =>
  import('./components/screens/ProductDetailModal').then((m) => ({ default: m.ProductDetailModal }))
);
const CheckoutScreen = React.lazy(() =>
  import('./components/screens/CheckoutScreen').then((m) => ({ default: m.CheckoutScreen }))
);
const SuccessModal = React.lazy(() =>
  import('./components/screens/SuccessModal').then((m) => ({ default: m.SuccessModal }))
);
const AdminScreen = React.lazy(() =>
  import('./components/screens/AdminScreen').then((m) => ({ default: m.AdminScreen }))
);
const CartDrawer = React.lazy(() =>
  import('./components/screens/CartDrawer').then((m) => ({ default: m.CartDrawer }))
);
const WishlistScreen = React.lazy(() =>
  import('./components/screens/WishlistScreen').then((m) => ({ default: m.WishlistScreen }))
);
const OrderTrackingModal = React.lazy(() =>
  import('./components/screens/OrderTrackingModal').then((m) => ({ default: m.OrderTrackingModal }))
);
const AdminPasswordModal = React.lazy(() =>
  import('./components/AdminPasswordModal').then((m) => ({ default: m.AdminPasswordModal }))
);
import {
  DynamicNotificationsProvider,
  useDynamicNotifications,
} from './components/notifications';
import {
  preloadLaunchAssets,
  startImageLoadingHierarchy,
} from './utils/imageLoaderHierarchy';
import {
  fetchMenuItemsFromFirestore,
  seedMenuCatalogIfEmpty,
  saveMenuItemToFirestore,
  deleteMenuItemFromFirestore,
  subscribeToMenuItems,
  submitOrderToFirestore,
  fetchCustomerOrders,
  subscribeToActiveOrder,
  updateOrderStatusInFirestore,
  cancelOrderInFirestore,
  dismissOrderInFirestore,
  getUserSessionScopeKey,
} from './services/firebase';
import {
  formatAddressWithLocationTag,
  cleanAreaName,
  formatLocationTag,
} from './utils/locationUtils';

const MENU_STORAGE_KEY = 'tendoz_menu_items_v2';

const getCartStorageKey = () => `tendoz_cart_items_${getUserSessionScopeKey()}`;
const getActiveOrderStorageKey = () => `tendoz_active_order_id_${getUserSessionScopeKey()}`;
const getActiveOrderDataKey = () => `tendoz_active_order_data_${getUserSessionScopeKey()}`;
const getDismissedOrdersStorageKey = () => `tendoz_dismissed_orders_${getUserSessionScopeKey()}`;

const enrichMenuItemsWithSizes = (itemsList: MenuItem[]): MenuItem[] => {
  if (!itemsList || !Array.isArray(itemsList)) return INITIAL_MENU_ITEMS;
  return itemsList.map((item) => {
    const initialItem = INITIAL_MENU_ITEMS.find((init) => init.id === item.id);
    if (initialItem && initialItem.sizes && (!item.sizes || item.sizes.length === 0)) {
      return {
        ...item,
        sizes: initialItem.sizes,
      };
    }
    return item;
  });
};

const getInitialMenuItems = (): MenuItem[] => {
  try {
    const saved = localStorage.getItem(MENU_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return enrichMenuItemsWithSizes(parsed);
      }
    }
  } catch {}
  return INITIAL_MENU_ITEMS;
};

const getDismissedOrderIds = (): string[] => {
  try {
    const raw = localStorage.getItem(getDismissedOrdersStorageKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const addDismissedOrderId = (orderId: string): void => {
  try {
    const current = getDismissedOrderIds();
    if (!current.includes(orderId)) {
      localStorage.setItem(
        getDismissedOrdersStorageKey(),
        JSON.stringify([...current, orderId])
      );
    }
  } catch {}
};

const getInitialCart = (): CartItem[] => {
  try {
    // Clear out legacy test carts once to ensure clean slate
    localStorage.removeItem('cart');
    localStorage.removeItem('tendoz_cart');

    const saved = localStorage.getItem(getCartStorageKey());
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.warn('Could not restore cart from storage', e);
  }
  return [];
};

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('home');
  const [items, setItems] = useState<MenuItem[]>(getInitialMenuItems);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [stats, setStats] = useState<AdminStats>(INITIAL_STATS);
  const [selectedItem, setSelectedItem] = useState<MenuItem>(INITIAL_MENU_ITEMS[0]);

  // Clean slate: cart initializes empty (no test products) or restored from persistent local storage
  const [cart, setCart] = useState<CartItem[]>(getInitialCart);
  const [wishlistIds, setWishlistIds] = useState<string[]>([
    INITIAL_MENU_ITEMS[0].id,
    INITIAL_MENU_ITEMS[17].id,
  ]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    try {
      const dismissed = getDismissedOrderIds();
      const saved = localStorage.getItem(getActiveOrderStorageKey());
      if (saved) {
        return dismissed.includes(saved) ? null : saved;
      }
      if (INITIAL_ORDERS[0] && !dismissed.includes(INITIAL_ORDERS[0].id)) {
        return INITIAL_ORDERS[0].id;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    try {
      const dismissed = getDismissedOrderIds();
      const savedData = localStorage.getItem(getActiveOrderDataKey());
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed?.id && !dismissed.includes(parsed.id) && !parsed.isDismissed) {
          return parsed;
        }
      }
      if (INITIAL_ORDERS[0] && !dismissed.includes(INITIAL_ORDERS[0].id)) {
        return INITIAL_ORDERS[0];
      }
    } catch {}
    return null;
  });
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // User Onboarding Location Selection State
  const [selectedLocation, setSelectedLocation] = useState<UserLocationSelection>(() => {
    try {
      const area = localStorage.getItem('tendoz_user_selected_area') || '';
      const orderType = (localStorage.getItem('tendoz_user_order_type') as 'Delivery' | 'Pick-Up') || 'Delivery';
      const branch = localStorage.getItem('tendoz_user_selected_branch') || 'Tendoz Main Boulevard Sahiwal (Near Pilot Girls School)';
      return { orderType, city: 'Sahiwal', area, branch };
    } catch {
      return { orderType: 'Delivery', city: 'Sahiwal', area: '', branch: 'Tendoz Main Boulevard Sahiwal (Near Pilot Girls School)' };
    }
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [hasCheckedOnboardingLocation, setHasCheckedOnboardingLocation] = useState(false);

  // Persist active order state so Delivered and in-flight statuses remain persistent across page refreshes
  useEffect(() => {
    try {
      if (activeOrder) {
        localStorage.setItem(getActiveOrderDataKey(), JSON.stringify(activeOrder));
      } else {
        localStorage.removeItem(getActiveOrderDataKey());
      }
    } catch (e) {
      console.warn('Could not save active order data', e);
    }
  }, [activeOrder]);

  // Sync cart state to persistent local storage on every addition, modification, or deletion
  useEffect(() => {
    try {
      localStorage.setItem(getCartStorageKey(), JSON.stringify(cart));
    } catch (e) {
      console.warn('Could not save cart to storage', e);
    }
  }, [cart]);

  // Firebase Firestore synchronization state
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);

  // Initialize and real-time synchronize Menu Catalog with Firebase Firestore (<1s sync & 100% persistence)
  useEffect(() => {
    let isMounted = true;

    async function initFirestoreCatalog() {
      try {
        const firestoreItems = await fetchMenuItemsFromFirestore();
        if (firestoreItems && firestoreItems.length > 0) {
          if (isMounted) {
            const enriched = enrichMenuItemsWithSizes(firestoreItems);
            setItems(enriched);
            try {
              localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(enriched));
            } catch {}
          }
        } else {
          // If Firestore menu is empty on first run, seed complete catalog (legacy + Chill Pill items)
          await seedMenuCatalogIfEmpty(INITIAL_MENU_ITEMS);
          const seeded = await fetchMenuItemsFromFirestore();
          if (isMounted && seeded && seeded.length > 0) {
            const enrichedSeeded = enrichMenuItemsWithSizes(seeded);
            setItems(enrichedSeeded);
            try {
              localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(enrichedSeeded));
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Firestore menu catalog note:', err);
      }
    }

    initFirestoreCatalog();

    // Real-time snapshot listener: any Admin change immediately syncs to front-end in <1s
    const unsubscribe = subscribeToMenuItems((firestoreItems) => {
      if (isMounted && firestoreItems && firestoreItems.length > 0) {
        const enriched = enrichMenuItemsWithSizes(firestoreItems);
        setItems(enriched);
        try {
          localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(enriched));
        } catch {}
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleSyncToFirestore = async () => {
    setIsFirebaseSyncing(true);
    try {
      await seedMenuCatalogIfEmpty(INITIAL_MENU_ITEMS);
      const updated = await fetchMenuItemsFromFirestore();
      if (updated && updated.length > 0) {
        setItems(updated);
        try {
          localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }
      trigger({
        id: `firestore_sync_${Date.now()}`,
        title: 'Firestore Menu Synced! 🔥',
        message: `All ${items.length} items across all categories are live in Firebase Firestore.`,
        type: 'success',
        accent: '#D81A07',
        duration: 3500,
      });
    } catch (err) {
      console.warn('Firestore sync warning:', err);
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  // Smooth App Launch Skeleton State (keeps loader active strictly once on cold boot)
  const hasAppLaunchedRef = React.useRef(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Dynamic in-app notifications hook (expo-dynamic-notifications top banner engine)
  const { trigger } = useDynamicNotifications();

  // App launch sequence: Preloads header logo and promotional carousel banners
  const startLaunchSequence = useCallback((force = false) => {
    if (hasAppLaunchedRef.current && !force) {
      return;
    }
    setIsAppLoading(true);
    const startTime = performance.now();

    // Preload top logo, promotional carousel banners, and popular items
    preloadLaunchAssets().then(() => {
      const elapsed = performance.now() - startTime;
      // Ultra-snappy splash duration (~50ms) for instant smooth transition without sluggish delay
      const minDisplayDuration = 50;
      const remainingTime = Math.max(0, minDisplayDuration - elapsed);

      setTimeout(() => {
        setIsAppLoading(false);
        hasAppLaunchedRef.current = true;
        // Background preloading triggered smoothly right after skeleton dismissal
        startImageLoadingHierarchy(items);
      }, remainingTime);
    });
  }, [items]);

  // Initial App Startup: Trigger smooth skeleton loading strictly once upon mount
  useEffect(() => {
    if (!hasAppLaunchedRef.current) {
      startLaunchSequence();
    }
  }, [startLaunchSequence]);

  // Persistent Location Pop-Up on Every Visit:
  // Ensure the location selection pop-up / screen appears every single time a user opens or visits the app
  useEffect(() => {
    if (isAppLoading || hasCheckedOnboardingLocation) return;
    setHasCheckedOnboardingLocation(true);
    setIsLocationModalOpen(true);
  }, [isAppLoading, hasCheckedOnboardingLocation]);

  // Welcome top banner on initial load (only fires after smooth app launch transition completes)
  useEffect(() => {
    if (isAppLoading) return;

    const welcomeTimer = setTimeout(() => {
      trigger({
        id: 'welcome_offer',
        title: '🔥 Hot Deals at Tendoz Sahiwal!',
        message: 'Get Flat 20% OFF on all signature pizzas & crispy burger combos today.',
        avatar: INITIAL_MENU_ITEMS[0].image,
        type: 'promo',
        accent: '#D81A07',
        duration: 5000,
        actionLabel: 'View Deal',
        onPress: () => {
          setSelectedItem(INITIAL_MENU_ITEMS[0]);
          setIsDetailModalOpen(true);
        },
      });
    }, 1200);

    return () => clearTimeout(welcomeTimer);
  }, [trigger, isAppLoading]);

  // Real-time synchronization of Active Order with Firebase Firestore backend
  useEffect(() => {
    if (!activeOrderId) {
      return;
    }

    const unsubscribe = subscribeToActiveOrder(activeOrderId, (updated) => {
      if (updated) {
        const dismissed = getDismissedOrderIds();
        if (updated.isDismissed || dismissed.includes(updated.id)) {
          setActiveOrder(null);
          setActiveOrderId(null);
          try {
            localStorage.removeItem(getActiveOrderStorageKey());
            localStorage.removeItem(getActiveOrderDataKey());
          } catch {}
          return;
        }

        setActiveOrder(updated);

        // Keep orders list in sync
        setOrders((prev) => {
          const index = prev.findIndex((o) => o.id === updated.id);
          if (index !== -1) {
            const next = [...prev];
            next[index] = updated;
            return next;
          }
          return [updated, ...prev];
        });

        // Keep the active order card visible and persistent when updated to 'Delivered' in the backend
        if (updated.status === 'Delivered') {
          trigger({
            id: `order_delivered_${updated.id}`,
            title: `Order #${updated.id} Delivered! 🎉`,
            message: 'Your food has arrived hot and fresh! Enjoy your meal.',
            type: 'success',
            accent: '#10B981',
            duration: 6000,
          });
          // Order stays persistent on frontend even after page refresh until dismissed
        } else if (updated.status === 'Out for Delivery') {
          trigger({
            id: `order_out_for_delivery_${updated.id}`,
            title: `Order #${updated.id} Out for Delivery! 🛵`,
            message: 'Our delivery rider is on the way with your hot meal!',
            type: 'order',
            accent: '#D81A07',
            duration: 5000,
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeOrderId, trigger]);

  // Live order status updater for Admin dispatch
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: 'Waiting for Restaurant' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Deleted Order' | 'Cancelled'
  ) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (activeOrder && activeOrder.id === orderId) {
      setActiveOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    try {
      await updateOrderStatusInFirestore(orderId, newStatus);
    } catch (err) {
      console.warn('Could not update order status in Firestore:', err);
    }
  };

  // Cancel order handler: marks status as 'Deleted Order' permanently in Firebase (<1s),
  // updates frontend UI to show 'Deleted Order' with Dismiss button.
  const handleCancelOrder = async (orderId: string) => {
    const cancelledTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Instantly update local state so UI updates with zero lag to 'Deleted Order'
    setActiveOrder((prev) =>
      prev && prev.id === orderId
        ? {
            ...prev,
            status: 'Deleted Order',
            isDeleted: true,
            deletedAt: cancelledTime,
            cancelledBy: 'Customer',
            cancelledAt: cancelledTime,
            trackingStep: 0,
          }
        : prev
    );

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'Deleted Order',
              isDeleted: true,
              deletedAt: cancelledTime,
              cancelledBy: 'Customer',
              cancelledAt: cancelledTime,
              trackingStep: 0,
            }
          : o
      )
    );

    // 2. Persist deletion to Firebase Firestore backend (<1 second)
    try {
      const currentTarget = (activeOrder && activeOrder.id === orderId) ? activeOrder : orders.find((o) => o.id === orderId);
      await cancelOrderInFirestore(orderId, currentTarget || undefined);
    } catch (err) {
      console.warn('Could not record cancelled order in Firestore:', err);
    }

    // 3. Dynamic in-app toast notification confirming order deletion
    trigger({
      id: `order_cancelled_${orderId}_${Date.now()}`,
      title: 'Order Deleted 🚫',
      message: `Order #${orderId} was deleted. Click Dismiss to remove it from view.`,
      type: 'warning',
      accent: '#D81A07',
      duration: 4500,
    });
  };

  // Dismiss active order card from Home Screen:
  // Removes/hides order permanently from frontend UI across page reloads while safely keeping record in Firebase
  const handleDismissActiveOrder = async () => {
    const targetId = activeOrderId || activeOrder?.id;
    if (targetId) {
      addDismissedOrderId(targetId);
      try {
        await dismissOrderInFirestore(targetId);
      } catch (err) {
        console.warn('Could not mark order dismissed in Firestore:', err);
      }
    }
    setActiveOrder(null);
    setActiveOrderId(null);
    try {
      localStorage.removeItem(getActiveOrderStorageKey());
      localStorage.removeItem(getActiveOrderDataKey());
    } catch {}
  };

  // Screen Navigation Handlers
  const handleNavigate = (screen: ScreenName) => {
    if (screen === 'admin' && !isAdminAuthenticated) {
      setIsAdminAuthModalOpen(true);
      return;
    }
    if (screen === 'details') {
      setIsDetailModalOpen(true);
      return;
    }
    if (screen === 'cart') {
      setIsCartDrawerOpen(true);
      return;
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectItem = (item: MenuItem) => {
    const initialMatch = INITIAL_MENU_ITEMS.find((i) => i.id === item.id);
    const enriched =
      (!item.sizes || item.sizes.length === 0) && initialMatch?.sizes
        ? { ...item, sizes: initialMatch.sizes }
        : item;
    setSelectedItem(enriched);
    setIsDetailModalOpen(true);
  };

  const handleOrderNow = (
    item: MenuItem,
    options?: {
      addOns?: string[];
      notes?: string;
      total?: number;
      size?: PizzaSize;
      price?: number;
      basePrice?: number;
      addOnsPrice?: number;
    }
  ) => {
    // Add item to cart with all customizations
    handleAddToCart(item, 1, options);
    setSelectedItem(item);
    setIsDetailModalOpen(false);
    setCurrentScreen('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (
    item: MenuItem,
    quantity: number = 1,
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
  ) => {
    const addOnsTotal = options?.addOnsPrice ?? 0;
    const basePrice = options?.basePrice ?? options?.price ?? item.price;
    // combined unit price of base item + extras
    const unitPrice = options?.price ?? (basePrice + addOnsTotal);
    const finalName = options?.size ? `${item.name} (${options.size})` : item.name;
    const addOnsList = options?.addOns || [];
    const addOnsKey = addOnsList.slice().sort().join('|');
    const sizeKey = options?.size || '';
    const notesKey = options?.notes || '';
    const cartItemId = `${item.id}-${sizeKey}-${addOnsKey}-${notesKey}`;

    const finalItem: MenuItem = {
      ...item,
      name: finalName,
      price: unitPrice, // combined price so standard item.price readers receive the correct total
    };

    setCart((prev) => {
      const existingIndex = prev.findIndex((cartItem) => {
        const itemAddOnsKey = (cartItem.addOns || []).slice().sort().join('|');
        const itemSizeKey = cartItem.selectedSize || '';
        const itemNotesKey = cartItem.notes || '';
        return (
          cartItem.item.id === item.id &&
          itemSizeKey === sizeKey &&
          itemAddOnsKey === addOnsKey &&
          itemNotesKey === notesKey
        );
      });

      if (existingIndex > -1) {
        return prev.map((c, idx) =>
          idx === existingIndex
            ? { ...c, quantity: c.quantity + quantity }
            : c
        );
      }

      return [
        ...prev,
        {
          id: cartItemId,
          item: finalItem,
          quantity,
          selectedDip: addOnsList.length ? addOnsList.join(', ') : undefined,
          selectedSize: options?.size,
          addOns: addOnsList,
          addOnsPrice: addOnsTotal,
          basePrice: basePrice,
          unitPrice: unitPrice,
          notes: options?.notes,
        },
      ];
    });

    const displayExtras = addOnsList.length > 0 ? ` (+${addOnsList.length} extras)` : '';

    // If added from PDP: Trigger white glassmorphism notification toast & navigate/redirect to Cart page (also tapping notification navigates to cart)
    if (options?.fromPDP) {
      trigger({
        id: `pdp_cart_${Date.now()}`,
        title: 'Products added to your cart',
        message: `${quantity > 1 ? `${quantity}x ` : ''}${finalName}${displayExtras} • Rs. ${(unitPrice * quantity).toLocaleString()}`,
        avatar: item.image,
        type: 'pdp-glass',
        variant: 'glass',
        duration: 3800,
        onPress: () => {
          setIsCartDrawerOpen(true);
        },
      });
      // Automatically navigate / redirect the user to the 'Your Cart' drawer
      setIsCartDrawerOpen(true);
    } else {
      // Standard quick add from category grid/plus button
      trigger({
        id: `cart_${Date.now()}`,
        title: 'Added to Food Bag! 🛍️',
        message: `${quantity > 1 ? `${quantity}x ` : ''}${finalName} • Rs. ${(unitPrice * quantity).toLocaleString()}`,
        avatar: item.image,
        type: 'order',
        accent: '#D81A07',
        duration: 3500,
        actionLabel: 'View Bag',
        onPress: () => {
          setIsCartDrawerOpen(true);
        },
      });
      setIsCartDrawerOpen(true);
    }
  };

  const handleToggleWishlist = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    setWishlistIds((prev) => {
      if (prev.includes(itemId)) {
        trigger({
          id: `wishlist_remove_${Date.now()}`,
          title: 'Removed from Favorites',
          message: item ? `${item.name} removed from saved cravings` : undefined,
          avatar: item?.image,
          type: 'info',
          accent: '#77787D',
          duration: 2500,
        });
        return prev.filter((id) => id !== itemId);
      } else {
        trigger({
          id: `wishlist_add_${Date.now()}`,
          title: 'Saved to Favorites ❤️',
          message: item ? `${item.name} saved to your craving list` : undefined,
          avatar: item?.image,
          type: 'success',
          accent: '#D81A07',
          duration: 3000,
          actionLabel: 'View Saved',
          onPress: () => {
            setCurrentScreen('wishlist');
          },
        });
        return [...prev, itemId];
      }
    });
  };

  const handleConfirmOrder = async (details: {
    customerName: string;
    address: string;
    phone: string;
    additionalPhone?: string;
    item: MenuItem;
    total: number;
    email?: string;
    specialInstructions?: string;
    pickupBranch?: string;
    items?: CartItem[];
  }) => {
    const nextOrderNum = (() => {
      try {
        const last = parseInt(
          localStorage.getItem('tdz_order_seq') || '0',
          10
        );
        const next = last + 1;
        localStorage.setItem('tdz_order_seq', next.toString());
        return `TDZ-${String(next).padStart(2, '0')}`;
      } catch {
        return `TDZ-${String(Math.floor(1 + Math.random() * 99)).padStart(2, '0')}`;
      }
    })();
    const newOrderId = nextOrderNum;
    const rawOrderItems = details.items && details.items.length > 0 ? details.items : cart;
    const orderItems = rawOrderItems.map((c) => {
      const itemObj = c.item || (c as any);
      const rawName = itemObj.name || (c as any).name || 'Menu Item';
      const category = (itemObj.category || (c as any).category || '').toString();
      const tag = (itemObj.tag || (c as any).tag || '').toString();
      const isDeal =
        category.toLowerCase().includes('deal') ||
        rawName.toLowerCase().includes('deal') ||
        tag.toLowerCase().includes('deal');

      const displayName = isDeal && !rawName.includes('(Deal)')
        ? `${rawName} (Deal)`
        : rawName;

      return {
        ...c,
        item: {
          ...itemObj,
          name: displayName,
        },
      };
    });

    const itemsDescription = orderItems
      .map((c) => {
        const displayName = c.item.name;
        const detailsStrList: string[] = [];
        if (c.selectedSize) {
          if (c.selectedSize.startsWith('Option')) {
            detailsStrList.push(`Combo: ${c.selectedSize}`);
          } else if (c.selectedSize.includes('piece') || c.selectedSize.includes('Pcs')) {
            detailsStrList.push(`Portion: ${c.selectedSize}`);
          } else {
            detailsStrList.push(`Size: ${c.selectedSize}`);
          }
        }
        if (c.addOns && c.addOns.length > 0) {
          detailsStrList.push(`Add-ons: ${c.addOns.join(', ')}`);
        }
        if (c.notes) {
          detailsStrList.push(`Note: ${c.notes}`);
        }
        const detailsStr = detailsStrList.length > 0 ? ` (${detailsStrList.join(' | ')})` : '';
        return `${c.quantity}x ${displayName}${detailsStr}`;
      })
      .join(', ');

    // Resolve user's selected location from pop-up
    const initialLoc = (() => {
      try {
        return (selectedLocation.area || localStorage.getItem('tendoz_user_selected_area') || '').trim();
      } catch {
        return (selectedLocation.area || '').trim();
      }
    })();
    const cleanLoc = cleanAreaName(initialLoc);
    const finalOrderAddress = formatAddressWithLocationTag(details.address, cleanLoc);
    const locationTag = formatLocationTag(cleanLoc);
    const effectiveOrderType = selectedLocation.orderType === 'Pick-Up' ? 'Takeaway' : 'Delivery';

    const newOrder: Order = {
      id: newOrderId,
      customerName: details.customerName,
      itemName: itemsDescription || details.item.name,
      itemId: details.item.id,
      price: details.item.price,
      deliveryCharge: 0,
      total: details.total,
      totalBill: details.total,
      date: 'Just now',
      status: 'Waiting for Restaurant',
      address: finalOrderAddress,
      phone: details.phone,
      additionalPhone: details.additionalPhone,
      selectedLocation: locationTag || undefined,
      trackingStep: 1,
      orderType: effectiveOrderType,
      items: orderItems,
    };

    // =========================================================================
    // DATABASE-FIRST ORDER PROCESSING FLOW:
    // 1. Primary Database Write: Write and save to Firebase Firestore FIRST.
    // 2. Sequential Execution: Prevent all downstream processes (local state
    //    updates, UI redirects, notifications, cart clearing) from running until
    //    the database write operation successfully completes.
    // =========================================================================
    try {
      await submitOrderToFirestore(
        newOrder,
        orderItems,
        details.additionalPhone,
        {
          email: details.email,
          specialInstructions: details.specialInstructions,
          pickupBranch: details.pickupBranch,
          selectedLocation: locationTag || undefined,
        }
      );
    } catch (err) {
      console.error('Database write failed during order submission:', err);
      trigger({
        id: `order_failed_${Date.now()}`,
        title: 'Order Placement Failed ⚠️',
        message: 'Could not save order to database. Please check your connection and try again.',
        type: 'warning',
        accent: '#D81A07',
        duration: 5000,
      });
      // Halts execution: prevents any downstream processes, state updates, or redirects
      throw err;
    }

    // --- SEQUENTIAL DOWNSTREAM PROCESSES (Executed ONLY after database write succeeds) ---
    // 1. Update local orders state and active order
    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    setActiveOrderId(newOrderId);

    // 2. Persist active order reference
    try {
      localStorage.setItem(getActiveOrderStorageKey(), newOrderId);
    } catch {}

    // 3. Update store metrics and stats
    setStats((prev) => ({
      ...prev,
      totalOrders: prev.totalOrders + 1,
      revenue: prev.revenue + details.total,
    }));

    // 4. Clear cart and storage
    setCart([]);
    try {
      localStorage.removeItem(getCartStorageKey());
    } catch {}

    // 5. UI Redirect to order success confirmation
    setCurrentScreen('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 6. Secondary notification workflow
    trigger({
      id: `order_placed_${newOrderId}`,
      title: `Order #${newOrderId} Confirmed! 🎉`,
      message: `${itemsDescription || details.item.name} • Total: Rs. ${details.total.toLocaleString()}. Kitchen is now preparing your meal!`,
      avatar: details.item.image,
      type: 'success',
      accent: '#D81A07',
      duration: 5000,
      actionLabel: 'Track Live',
      onPress: () => {
        setIsTrackingOpen(true);
      },
    });
  };

  // Cart operations (prioritizes unique cart item ID and falls back to dish ID)
  const handleUpdateQuantity = (identifier: string, delta: number) => {
    setCart((prev) => {
      const hasExactId = prev.some((c) => c.id === identifier);
      return prev
        .map((cartItem) => {
          const isTarget = hasExactId
            ? cartItem.id === identifier
            : cartItem.item.id === identifier;
          if (isTarget) {
            const newQty = cartItem.quantity + delta;
            return newQty > 0 ? { ...cartItem, quantity: newQty } : null;
          }
          return cartItem;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (identifier: string) => {
    setCart((prev) => {
      const hasExactId = prev.some((c) => c.id === identifier);
      const target = hasExactId
        ? prev.find((c) => c.id === identifier)
        : prev.find((c) => c.item.id === identifier);

      if (target) {
        trigger({
          id: `cart_remove_${Date.now()}`,
          title: 'Removed from food bag',
          message: target.item.name,
          avatar: target.item.image,
          type: 'info',
          accent: '#77787D',
          duration: 2500,
        });
      }

      return prev.filter((cartItem) =>
        hasExactId
          ? cartItem.id !== identifier
          : cartItem.item.id !== identifier
      );
    });
  };

  // Kitchen Admin operations: DATABASE-FIRST with instant front-end sync (<1s) & 100% persistence
  const handleAddItem = async (itemData: Partial<MenuItem>) => {
    const newItem: MenuItem = {
      id: `dish-${Date.now()}`,
      name: itemData.name?.trim() || 'Signature Special Dish',
      category: itemData.category || 'Deals',
      price: Number(itemData.price) || 550,
      originalPrice: Number(itemData.price) || 550,
      calories: Number(itemData.calories) || 620,
      prepTime: itemData.prepTime?.trim() || '12-15 min',
      rating: 4.9,
      spiceLevel: itemData.spiceLevel || 'Medium',
      description:
        itemData.description?.trim() || 'Special house crispy recipe seasoned with chef spices.',
      image: itemData.image?.trim() || INITIAL_MENU_ITEMS[0].image,
      tag: itemData.tag?.trim() || 'New Dish',
      isPopular: itemData.isPopular !== undefined ? Boolean(itemData.isPopular) : false,
      servings: '1-2 persons',
      dipsIncluded: 1,
    };

    // 1. Database-First: Save to Firebase Firestore FIRST
    try {
      await saveMenuItemToFirestore(newItem);
    } catch (err) {
      console.error('Could not persist dish to Firestore:', err);
      trigger({
        id: `admin_add_err_${Date.now()}`,
        title: 'Save Failed ⚠️',
        message: 'Could not save new dish. Please check your connection.',
        type: 'warning',
        accent: '#D81A07',
        duration: 4000,
      });
      throw err;
    }

    // 2. Reflect on front-end UI within 1 second
    setItems((prev) => {
      const next = [newItem, ...prev.filter((i) => i.id !== newItem.id)];
      try {
        localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setStats((prev) => ({ ...prev, totalMenuItems: prev.totalMenuItems + 1 }));

    trigger({
      id: `admin_add_${newItem.id}`,
      title: 'Dish Added to Menu! 🍽️',
      message: `"${newItem.name}" is now live on your menu.`,
      avatar: newItem.image,
      type: 'success',
      accent: '#D81A07',
      duration: 3500,
    });
  };

  const handleEditItem = async (id: string, updated: Partial<MenuItem>) => {
    const existing = items.find((i) => i.id === id);
    if (!existing) return;

    const updatedDish: MenuItem = {
      ...existing,
      ...updated,
      id,
      name: updated.name !== undefined ? updated.name.trim() : existing.name,
      price: updated.price !== undefined ? Number(updated.price) : existing.price,
      originalPrice:
        updated.price !== undefined ? Number(updated.price) : existing.price,
      description:
        updated.description !== undefined ? updated.description.trim() : existing.description,
      image:
        updated.image !== undefined && updated.image.trim() ? updated.image.trim() : existing.image,
      category: updated.category !== undefined ? updated.category : existing.category,
      tag: updated.tag !== undefined ? updated.tag.trim() : existing.tag,
      prepTime: updated.prepTime !== undefined ? updated.prepTime.trim() : existing.prepTime,
      calories:
        updated.calories !== undefined ? Number(updated.calories) : existing.calories,
      spiceLevel:
        updated.spiceLevel !== undefined ? updated.spiceLevel : existing.spiceLevel,
      isPopular:
        updated.isPopular !== undefined ? Boolean(updated.isPopular) : Boolean(existing.isPopular),
    };

    // 1. Database-First: Update Firebase Firestore FIRST
    try {
      await saveMenuItemToFirestore(updatedDish);
    } catch (err) {
      console.error('Could not update dish in Firestore:', err);
      trigger({
        id: `admin_edit_err_${Date.now()}`,
        title: 'Update Failed ⚠️',
        message: 'Could not update dish. Please check your connection.',
        type: 'warning',
        accent: '#D81A07',
        duration: 4000,
      });
      throw err;
    }

    // 2. Reflect on front-end UI within 1 second
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? updatedDish : i));
      try {
        localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    const isOnlyPopularToggled = updated.isPopular !== undefined && Object.keys(updated).length === 1;
    trigger({
      id: `admin_update_${id}_${Date.now()}`,
      title: isOnlyPopularToggled
        ? (updatedDish.isPopular ? 'Popular Badge Assigned! ⭐' : 'Popular Badge Removed')
        : 'Dish Updated! ✨',
      message: isOnlyPopularToggled
        ? `"${updatedDish.name}" is ${updatedDish.isPopular ? 'now marked Popular' : 'no longer marked Popular'}.`
        : `"${updatedDish.name}" changes saved and live.`,
      avatar: updatedDish.image,
      type: 'success',
      accent: updatedDish.isPopular ? '#FFC700' : '#10B981',
      duration: 3500,
    });
  };

  const handleDeleteItem = async (id: string) => {
    // 1. Database-First: Delete from Firebase Firestore FIRST
    try {
      await deleteMenuItemFromFirestore(id);
    } catch (err) {
      console.error('Could not remove dish from Firestore:', err);
      trigger({
        id: `admin_del_err_${Date.now()}`,
        title: 'Deletion Failed ⚠️',
        message: 'Could not delete dish. Please check your connection.',
        type: 'warning',
        accent: '#D81A07',
        duration: 4000,
      });
      throw err;
    }

    // 2. Reflect on front-end UI within 1 second
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      try {
        localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setStats((prev) => ({ ...prev, totalMenuItems: Math.max(0, prev.totalMenuItems - 1) }));

    trigger({
      id: `admin_delete_${id}`,
      title: 'Dish Removed from Menu',
      message: 'Product removed permanently from restaurant menu.',
      type: 'warning',
      accent: '#D81A07',
      duration: 3000,
    });
  };

  const handleManualNotificationTrigger = () => {
    const randomItems = [
      {
        title: '🔥 Chef Special Today!',
        message: 'Try our Crispy Broast Piece with signature garlic dip at 15% OFF.',
        avatar: INITIAL_MENU_ITEMS[3]?.image || INITIAL_MENU_ITEMS[0].image,
        item: INITIAL_MENU_ITEMS[3] || INITIAL_MENU_ITEMS[0],
      },
      {
        title: '🍔 Mega Zinger Deal is Live',
        message: 'Crunchy battered fillet, fresh iceberg & spicy mayo on toasted brioche bun.',
        avatar: INITIAL_MENU_ITEMS[1]?.image || INITIAL_MENU_ITEMS[0].image,
        item: INITIAL_MENU_ITEMS[1] || INITIAL_MENU_ITEMS[0],
      },
      {
        title: '🍕 Cheesy Pizza Night Alert',
        message: 'Order any Large Pizza & get free 1L drink with hot garlic dips!',
        avatar: INITIAL_MENU_ITEMS[0]?.image,
        item: INITIAL_MENU_ITEMS[0],
      },
    ];
    const picked = randomItems[Math.floor(Math.random() * randomItems.length)];
    trigger({
      id: `promo_${Date.now()}`,
      title: picked.title,
      message: picked.message,
      avatar: picked.avatar,
      type: 'promo',
      accent: '#D81A07',
      duration: 4500,
      actionLabel: 'Order Now',
      onPress: () => {
        setSelectedItem(picked.item);
        setIsDetailModalOpen(true);
      },
    });
  };

  const wishlistItems = items.filter((i) => wishlistIds.includes(i.id));
  const cartTotalCount = cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

  return (
    <div className="relative min-h-screen bg-neutral-50/60 text-neutral-900 flex flex-col font-sans selection:bg-[#D81A07] selection:text-white">
      {/* Smooth App Launch Initial Skeleton Loading Screen (Matches Reference Image) */}
      <AnimatePresence>
        {isAppLoading && (
          <motion.div
            key="app-launch-skeleton-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.995 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 bg-white overflow-y-auto"
          >
            <AppLaunchSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tendoz Restaurant Web Header */}
      <WebHeader
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        cartCount={cartTotalCount}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartDrawerOpen(true)}
        onTriggerNotification={handleManualNotificationTrigger}
        selectedLocation={selectedLocation}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
      />

      {/* Main Full-Width Content Area */}
      <main className="flex-1 w-full flex flex-col">
        <AnimatePresence mode="wait">
          {(currentScreen === 'home' || currentScreen === 'cart') && (
            <HomeScreen
              key="home"
              items={items}
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
              onSelectItem={handleSelectItem}
              onOrderNow={handleOrderNow}
              onAddToCart={handleAddToCart}
              cartCount={cartTotalCount}
              onOpenCart={() => setIsCartDrawerOpen(true)}
              onNavigate={handleNavigate}
              activeOrder={activeOrder}
              onOpenOrderTracking={() => setIsTrackingOpen(true)}
              onCancelOrder={handleCancelOrder}
              onDismissActiveOrder={handleDismissActiveOrder}
            />
          )}

          <React.Suspense fallback={null}>
            {currentScreen === 'new-menu' && (
              <NewMenuScreen
                key="new-menu"
                items={items}
                wishlistIds={wishlistIds}
                onToggleWishlist={handleToggleWishlist}
                onSelectItem={handleSelectItem}
                onOrderNow={handleOrderNow}
                onAddToCart={handleAddToCart}
                cartCount={cartTotalCount}
                onOpenCart={() => setIsCartDrawerOpen(true)}
                onNavigate={handleNavigate}
              />
            )}

            {currentScreen === 'checkout' && (
              <CheckoutScreen
                key="checkout"
                item={selectedItem}
                cartItems={cart}
                selectedLocation={selectedLocation}
                onOpenLocationModal={() => setIsLocationModalOpen(true)}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveFromCart}
                onBack={() => handleNavigate('home')}
                onConfirmOrder={handleConfirmOrder}
              />
            )}

            {currentScreen === 'success' && activeOrder && (
              <SuccessModal
                key="success"
                order={activeOrder}
                onClose={() => handleNavigate('home')}
                onNotifyMe={() => {
                  trigger({
                    id: `notif_subscribed_${Date.now()}`,
                    title: 'Push Notifications Enabled! 🔔',
                    message: `We will alert you the moment Order #${activeOrder.id} is Out for Delivery!`,
                    type: 'success',
                    accent: '#10B981',
                    duration: 4500,
                  });
                  handleNavigate('home');
                }}
              />
            )}

            {currentScreen === 'admin' && (
              <AdminScreen
                key="admin"
                items={items}
                onAddItem={handleAddItem}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
                onSelectItem={handleSelectItem}
                onSyncToFirestore={handleSyncToFirestore}
                isSyncing={isFirebaseSyncing}
                onBack={() => handleNavigate('home')}
              />
            )}

            {currentScreen === 'wishlist' && (
              <WishlistScreen
                key="wishlist"
                wishlistItems={wishlistItems}
                onToggleWishlist={handleToggleWishlist}
                onSelectItem={handleSelectItem}
                onOrderNow={handleOrderNow}
                onAddToCart={handleAddToCart}
                onExplore={() => handleNavigate('home')}
              />
            )}
          </React.Suspense>
        </AnimatePresence>
      </main>

      {/* Tendoz Restaurant Custom Website Footer */}
      <Footer
        onNavigate={handleNavigate}
        onReplayLaunchSkeleton={startLaunchSequence}
      />

      {/* Slide-over Animated Cart Drawer Matching Reference Layout Exactly */}
      <React.Suspense fallback={null}>
        <CartDrawer
          isOpen={isCartDrawerOpen || currentScreen === 'cart'}
          onClose={() => {
            setIsCartDrawerOpen(false);
            if (currentScreen === 'cart') {
              setCurrentScreen('home');
            }
          }}
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveFromCart}
          onCheckout={() => {
            setIsCartDrawerOpen(false);
            handleNavigate('checkout');
          }}
          onExplore={() => {
            setIsCartDrawerOpen(false);
            if (currentScreen === 'cart') {
              setCurrentScreen('home');
            }
          }}
          onAddToCart={handleAddToCart}
        />
      </React.Suspense>

      {/* Redesigned Centered Product Detail Page (PDP) Modal */}
      <React.Suspense fallback={null}>
        <AnimatePresence>
          {isDetailModalOpen && selectedItem && (
            <ProductDetailModal
              isOpen={isDetailModalOpen}
              item={selectedItem}
              onClose={() => setIsDetailModalOpen(false)}
              onAddToCart={handleAddToCart}
            />
          )}
        </AnimatePresence>
      </React.Suspense>

      {/* Live Kitchen Order Tracking Modal */}
      <React.Suspense fallback={null}>
        {isTrackingOpen && activeOrder && (
          <OrderTrackingModal
            order={activeOrder}
            onClose={() => setIsTrackingOpen(false)}
            onBackToHome={() => {
              setIsTrackingOpen(false);
              handleNavigate('home');
            }}
            onCancelOrder={handleCancelOrder}
            onDismiss={handleDismissActiveOrder}
          />
        )}
      </React.Suspense>

      {/* Onboarding & User Location Selection Modal */}
      <LocationSelectionModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(sel) => setSelectedLocation(sel)}
        initialSelection={selectedLocation}
        allowCloseWithoutSelect={Boolean(localStorage.getItem('tendoz_user_selected_area'))}
      />

      {/* Admin Security Password Protection Modal */}
      <React.Suspense fallback={null}>
        <AdminPasswordModal
          isOpen={isAdminAuthModalOpen}
          onClose={() => setIsAdminAuthModalOpen(false)}
          onSuccess={() => {
            setIsAdminAuthenticated(true);
            setIsAdminAuthModalOpen(false);
            setCurrentScreen('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            trigger({
              id: `admin_auth_success_${Date.now()}`,
              title: 'Admin Session Unlocked 🔓',
              message: 'Welcome to Tendoz Kitchen Management Admin Panel.',
              type: 'success',
              accent: '#10B981',
              duration: 3500,
            });
          }}
        />
      </React.Suspense>
    </div>
  );
}

export default function App() {
  return (
    <DynamicNotificationsProvider duration={4000} accent="#D81A07">
      <MainApp />
    </DynamicNotificationsProvider>
  );
}
