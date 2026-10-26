export type ScreenName = 
  | 'home' 
  | 'new-menu'
  | 'details' 
  | 'checkout' 
  | 'success' 
  | 'admin' 
  | 'cart' 
  | 'wishlist';

export type MenuCategory =
  | 'Popular'
  | 'Pizzas'
  | 'Pizza'
  | 'Burgers'
  | 'Deals'
  | 'Appetizers'
  | 'Fried Chicken'
  | 'Injected Broast'
  | 'Wraps'
  | 'Pastas'
  | 'Pasta'
  | 'Flavoured Soda'
  | 'Soft Drinks'
  | 'Drinks'
  | 'Iced Coffee'
  | 'Frappes'
  | 'Smoothies'
  | 'Hot Speciality'
  | 'Chill Pill Matcha'
  | 'Liquid Nitrogen Ice Cream'
  | 'Chill Pill Nitro Special'
  | 'Boba Tea'
  | 'Mocktails'
  | 'Margarita & Lemonade'
  | 'Chiller'
  | 'Chill Pill Special Shakes'
  | (string & {});

export type PizzaSize = 'Small' | 'Medium' | 'Large' | string;

export interface PizzaSizeOption {
  size: PizzaSize;
  label: string;
  price: number;
  inches?: string;
  servings?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  originalPrice: number;
  description: string;
  calories: number;
  prepTime: string;
  rating: number;
  spiceLevel: 'None' | 'Mild' | 'Medium' | 'Hot' | 'Fiery Hot';
  image: string;
  tag?: string;
  isPopular?: boolean;
  servings?: string;
  dipsIncluded?: number;
  sizes?: PizzaSizeOption[];
}

export interface CartItem {
  id?: string;
  item: MenuItem;
  quantity: number;
  selectedDip?: string;
  selectedSize?: PizzaSize;
  addOns?: string[];
  addOnsPrice?: number;
  basePrice?: number;
  unitPrice?: number;
  notes?: string;
}

export interface Order {
  id: string;
  customerName: string;
  itemName: string;
  itemId: string;
  price: number;
  deliveryCharge: number;
  total: number;
  date: string;
  status: 'Waiting for Restaurant' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Deleted Order' | 'Cancelled';
  address: string;
  phone: string;
  additionalPhone?: string;
  selectedLocation?: string;
  trackingStep?: number;
  orderType: 'Delivery' | 'Takeaway';
  items?: CartItem[];
  subtotal?: number;
  tax?: number;
  totalBill?: number;
  cancelledBy?: string;
  cancelledAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  isDismissed?: boolean;
  dismissedAt?: string;
}

export interface AdminStats {
  totalOrders: number;
  totalMenuItems: number;
  revenue: number;
}
