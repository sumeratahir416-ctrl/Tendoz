import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocFromServer,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MenuItem, Order, CartItem } from '../types';
import { formatAddressWithLocationTag, formatLocationTag, cleanAreaName } from '../utils/locationUtils';

// Initialize Firebase App and Services
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Specification matching skill instructions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on initial boot as mandated by skill
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Verify network/configuration.');
    }
  }
}
testConnection();

// ==========================================
// Authentication Helpers
// ==========================================
export async function signInWithGoogleAccount(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In Error:', error);
    return null;
  }
}

export async function logOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
  }
}

// Device Session Storage for isolated guest cart & order privacy
const DEVICE_USER_KEY = 'tendoz_device_user_id_v3';

export function getOrCreateDeviceUserId(): string {
  try {
    let id = localStorage.getItem(DEVICE_USER_KEY);
    if (!id) {
      id = `usr_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      localStorage.setItem(DEVICE_USER_KEY, id);
    }
    return id;
  } catch {
    return 'usr_guest_session';
  }
}

export function getUserSessionScopeKey(): string {
  const authUid = auth.currentUser?.uid;
  if (authUid) return authUid;
  return getOrCreateDeviceUserId();
}

// ==========================================
// Collection 1: menu CRUD & Sync
// ==========================================
export const MENU_COLLECTION = 'menu';

export async function fetchMenuItemsFromFirestore(): Promise<MenuItem[]> {
  try {
    const snapshot = await getDocs(collection(db, MENU_COLLECTION));
    if (snapshot.empty) {
      return [];
    }
    const items: MenuItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as MenuItem);
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, MENU_COLLECTION);
  }
}

/**
 * Real-time listener for the Firestore menu catalog (<1 second sync across front-end)
 */
export function subscribeToMenuItems(
  onUpdate: (items: MenuItem[]) => void
): () => void {
  const colRef = collection(db, MENU_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
        return;
      }
      const items: MenuItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as MenuItem);
      });
      onUpdate(items);
    },
    (error) => {
      console.warn('Real-time menu subscription notice:', error);
    }
  );
}

export async function saveMenuItemToFirestore(item: MenuItem): Promise<void> {
  const docPath = `${MENU_COLLECTION}/${item.id}`;
  try {
    // Sanitize item ensuring no undefined values
    const payload: Record<string, any> = {
      id: item.id,
      name: item.name,
      category: item.category,
      price: Number(item.price),
      originalPrice: Number(item.originalPrice || item.price),
      description: item.description || '',
      image: item.image || '',
      calories: item.calories || 0,
      prepTime: item.prepTime || '5-10 min',
      rating: item.rating || 5.0,
      spiceLevel: item.spiceLevel || 'None',
      servings: item.servings || '1 person',
      isPopular: Boolean(item.isPopular),
      tag: item.tag || '',
      dipsIncluded: item.dipsIncluded || 0,
    };
    if (item.sizes && item.sizes.length > 0) {
      payload.sizes = item.sizes;
    }
    await setDoc(doc(db, MENU_COLLECTION, item.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteMenuItemFromFirestore(itemId: string): Promise<void> {
  const docPath = `${MENU_COLLECTION}/${itemId}`;
  try {
    await deleteDoc(doc(db, MENU_COLLECTION, itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Seed full menu catalog to Firestore if the collection is currently empty
 */
export async function seedMenuCatalogIfEmpty(catalog: MenuItem[]): Promise<void> {
  try {
    const existing = await getDocs(collection(db, MENU_COLLECTION));
    if (existing.empty && catalog.length > 0) {
      console.log(`Seeding ${catalog.length} items to Firestore 'menu' collection...`);
      // Batch write items
      for (const item of catalog) {
        await saveMenuItemToFirestore(item);
      }
      console.log('Seeding completed successfully.');
    }
  } catch (error) {
    console.warn('Could not auto-seed menu catalog:', error);
  }
}

// ==========================================
// Collection 2: orders Management
// ==========================================
export const ORDERS_COLLECTION = 'orders';

export interface FirestoreOrderPayload {
  id: string;
  customerName: string;
  phone: string;
  additionalPhone?: string;
  address: string;
  selectedLocation?: string;
  total: number;
  totalBill: number;
  status: 'Waiting for Restaurant' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Deleted Order' | 'Cancelled';
  date: string;
  orderType: 'Delivery' | 'Takeaway';
  trackingStep: number;
  userId: string;
  cancelledBy?: string;
  cancelledAt?: any;
  isDeleted?: boolean;
  deletedAt?: any;
  isDismissed?: boolean;
  dismissedAt?: any;
  pickupBranch?: string;
  specialInstructions?: string;
  email?: string;
  items: Array<{
    id?: string;
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    unitPrice?: number;
    selectedSize?: string;
    selectedDip?: string;
    addOns?: string[];
    notes?: string;
    image?: string;
  }>;
  createdAt?: any;
}

export async function submitOrderToFirestore(
  order: Order,
  cartItems: CartItem[],
  additionalPhone?: string,
  extraDetails?: {
    email?: string;
    specialInstructions?: string;
    pickupBranch?: string;
    selectedLocation?: string;
  }
): Promise<void> {
  const docPath = `${ORDERS_COLLECTION}/${order.id}`;
  const userScopeId = getUserSessionScopeKey();

  const serializedItems = (cartItems.length > 0 ? cartItems : (order.items || [])).map((c) => {
    const rawName = c.item?.name || (c as any).name || order.itemName || 'Item';
    const category = c.item?.category || (c as any).category || '';
    const tag = c.item?.tag || (c as any).tag || '';

    const isDeal =
      category.toLowerCase().includes('deal') ||
      rawName.toLowerCase().includes('deal') ||
      tag.toLowerCase().includes('deal');

    let formattedName = rawName;
    if (isDeal && !formattedName.includes('(Deal)')) {
      formattedName = `${formattedName} (Deal)`;
    }

    return {
      id: c.id || c.item?.id,
      itemId: c.item?.id || order.itemId,
      name: formattedName,
      quantity: c.quantity || 1,
      price: c.unitPrice || c.item?.price || order.price,
      unitPrice: c.unitPrice || c.item?.price || order.price,
      selectedSize: c.selectedSize || '',
      selectedDip: c.selectedDip || '',
      addOns: c.addOns || [],
      notes: c.notes || '',
      image: c.item?.image || '',
    };
  });

  // Resolve user's location selection (chosen during pop-up)
  const rawLoc = (
    extraDetails?.selectedLocation ||
    order.selectedLocation ||
    (typeof window !== 'undefined' ? localStorage.getItem('tendoz_user_selected_area') : '') ||
    ''
  ).trim();
  const cleanLoc = cleanAreaName(rawLoc);
  const finalAddress = formatAddressWithLocationTag(order.address, cleanLoc);
  const locationTag = formatLocationTag(cleanLoc);

  const orderPayload: FirestoreOrderPayload = {
    id: order.id,
    customerName: order.customerName,
    phone: order.phone,
    additionalPhone: additionalPhone || '',
    address: finalAddress,
    selectedLocation: locationTag,
    total: Number(order.total),
    totalBill: Number(order.total),
    status: order.status || 'Waiting for Restaurant',
    date: order.date || new Date().toISOString(),
    orderType: order.orderType || 'Takeaway',
    trackingStep: order.trackingStep || 1,
    userId: userScopeId,
    pickupBranch: extraDetails?.pickupBranch || '',
    email: extraDetails?.email || '',
    items: serializedItems,
    createdAt: serverTimestamp(),
  };

  if (extraDetails?.specialInstructions?.trim()) {
    orderPayload.specialInstructions = extraDetails.specialInstructions.trim();
  }

  try {
    await setDoc(doc(db, ORDERS_COLLECTION, order.id), orderPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function fetchCustomerOrders(userUid?: string): Promise<Order[]> {
  try {
    const targetUserId = userUid || getUserSessionScopeKey();
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, where('userId', '==', targetUserId));
    const snapshot = await getDocs(q);
    const result: Order[] = [];
    snapshot.forEach((snap) => {
      const data = snap.data();
      result.push({
        id: data.id,
        customerName: data.customerName,
        itemName:
          data.items && data.items.length > 0
            ? data.items.map((it: any) => `${it.quantity}x ${it.name}`).join(', ')
            : data.itemName || 'Order Item',
        itemId: data.items?.[0]?.itemId || '',
        price: data.total,
        deliveryCharge: 0,
        total: data.totalBill || data.total,
        totalBill: data.totalBill || data.total,
        date: data.date || 'Recently',
        status: data.status,
        address: data.address,
        phone: data.phone,
        additionalPhone: data.additionalPhone,
        trackingStep: data.trackingStep || 2,
        orderType: data.orderType || 'Takeaway',
        items: data.items || [],
        cancelledBy: data.cancelledBy,
        cancelledAt: data.cancelledAt,
        isDeleted: Boolean(data.isDeleted || data.status === 'Deleted Order'),
        isDismissed: Boolean(data.isDismissed),
      });
    });
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
  }
}

/**
 * Real-time listener for active customer order synchronization
 */
export function subscribeToActiveOrder(
  orderId: string,
  onUpdate: (order: Order | null) => void
): () => void {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
        return;
      }
      const data = snap.data();
      const updatedOrder: Order = {
        id: data.id || orderId,
        customerName: data.customerName || 'Valued Customer',
        itemName:
          data.items && data.items.length > 0
            ? data.items.map((it: any) => `${it.quantity}x ${it.name}`).join(', ')
            : data.itemName || 'Order Item',
        itemId: data.items?.[0]?.itemId || data.itemId || '',
        price: data.total,
        deliveryCharge: 0,
        total: data.totalBill || data.total,
        totalBill: data.totalBill || data.total,
        date: data.date || 'Recently',
        status: data.status,
        address: data.address || '',
        phone: data.phone || '',
        additionalPhone: data.additionalPhone || '',
        trackingStep:
          data.trackingStep ||
          (data.status === 'Delivered'
            ? 4
            : data.status === 'Out for Delivery'
            ? 3
            : data.status === 'Preparing'
            ? 2
            : 1),
        orderType: data.orderType || 'Takeaway',
        items: data.items,
        cancelledBy: data.cancelledBy,
        cancelledAt: data.cancelledAt,
        isDeleted: Boolean(data.isDeleted || data.status === 'Deleted Order'),
        deletedAt: data.deletedAt ? String(data.deletedAt) : undefined,
        isDismissed: Boolean(data.isDismissed),
        dismissedAt: data.dismissedAt ? String(data.dismissedAt) : undefined,
      };
      onUpdate(updatedOrder);
    },
    (error) => {
      console.warn('Real-time order listener notice:', error);
    }
  );
}

/**
 * Update order dispatch and delivery status in Firestore
 */
export async function updateOrderStatusInFirestore(
  orderId: string,
  newStatus: 'Waiting for Restaurant' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Deleted Order' | 'Cancelled',
  trackingStep?: number
): Promise<void> {
  const docPath = `${ORDERS_COLLECTION}/${orderId}`;
  try {
    const step =
      trackingStep ??
      (newStatus === 'Delivered'
        ? 4
        : newStatus === 'Out for Delivery'
        ? 3
        : newStatus === 'Preparing'
        ? 2
        : 1);
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      status: newStatus,
      trackingStep: step,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

/**
 * Cancel and record deleted order in Firestore backend by customer
 * Permanently marks status as 'Deleted Order' and isDeleted: true in backend
 */
export async function cancelOrderInFirestore(
  orderId: string,
  fallbackOrder?: Partial<Order>
): Promise<void> {
  const docPath = `${ORDERS_COLLECTION}/${orderId}`;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, {
        status: 'Deleted Order',
        isDeleted: true,
        deletedAt: serverTimestamp(),
        cancelledBy: 'Customer',
        cancelledAt: serverTimestamp(),
        trackingStep: 0,
      });
    } else {
      // Document doesn't exist in Firestore yet (e.g. demo order AFC-0000025), seed it as Deleted Order
      const payload: Record<string, any> = {
        id: orderId,
        customerName: fallbackOrder?.customerName || 'Customer',
        phone: fallbackOrder?.phone || '0300-1234567',
        additionalPhone: fallbackOrder?.additionalPhone || '',
        address: fallbackOrder?.address || 'Near Pilot Girls School, Sahiwal, Punjab',
        total: Number(fallbackOrder?.total || 6250),
        totalBill: Number(fallbackOrder?.totalBill || fallbackOrder?.total || 6250),
        status: 'Deleted Order',
        isDeleted: true,
        deletedAt: serverTimestamp(),
        cancelledBy: 'Customer',
        cancelledAt: serverTimestamp(),
        date: fallbackOrder?.date || 'Just now',
        trackingStep: 0,
        orderType: fallbackOrder?.orderType || 'Takeaway',
        userId: auth.currentUser?.uid || 'guest',
        items: (fallbackOrder?.items || []).map((c) => ({
          itemId: c.item?.id || '',
          name: c.item?.name || '',
          quantity: c.quantity || 1,
          price: c.item?.price || 0,
        })),
        createdAt: serverTimestamp(),
      };
      await setDoc(docRef, payload);
    }
  } catch (error) {
    console.warn('cancelOrderInFirestore note:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    } catch (e) {
      // Re-log structured error but do not prevent frontend UI state from updating
      console.warn('Firestore update notice (continuing with UI refresh):', e);
    }
  }
}

/**
 * Permanently mark order as dismissed in backend database
 */
export async function dismissOrderInFirestore(orderId: string): Promise<void> {
  const docPath = `${ORDERS_COLLECTION}/${orderId}`;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      isDismissed: true,
      dismissedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('dismissOrderInFirestore note:', error);
  }
}

