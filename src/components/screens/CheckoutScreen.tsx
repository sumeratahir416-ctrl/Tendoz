import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  ChevronDown,
  Check,
  MapPin,
  Receipt,
  Truck,
  ArrowLeft,
  X,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  Phone,
  Sparkles,
  Flame,
} from 'lucide-react';
import { MenuItem, CartItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import { tendozBrandLogoImg } from '../../data/initialData';

interface CheckoutScreenProps {
  item: MenuItem;
  cartItems?: CartItem[];
  onBack: () => void;
  onConfirmOrder: (orderDetails: {
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
  }) => Promise<void> | void;
  onUpdateQuantity?: (itemId: string, delta: number) => void;
  onRemoveItem?: (itemId: string) => void;
}

interface Branch {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
}

const AVAILABLE_BRANCHES: Branch[] = [
  {
    id: 'sahiwal-main',
    name: 'Tendoz Main Boulevard Sahiwal',
    addressLine1: 'Near Pilot Girls School',
    addressLine2: 'Sahiwal, Punjab',
  },
];

interface WhatsAppReceiptParams {
  userName: string;
  phone: string;
  altPhone?: string;
  orderType: string;
  address: string;
  initialLocation?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  specialInstructions?: string;
}

export function buildWhatsAppReceiptMessage(params: WhatsAppReceiptParams): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const altPhoneDisplay = params.altPhone && params.altPhone.trim() ? params.altPhone.trim() : 'Not entered';

  const itemLines = params.items
    .map((c) => {
      const itemObj = c.item || (c as any);
      const rawName = itemObj.name || (c as any).name || 'Menu Item';
      const category = (itemObj.category || (c as any).category || '').toString();
      const tag = (itemObj.tag || (c as any).tag || '').toString();

      const isDeal =
        category.toLowerCase().includes('deal') ||
        rawName.toLowerCase().includes('deal') ||
        tag.toLowerCase().includes('deal');

      const displayName =
        isDeal && !rawName.includes('(Deal)') ? `${rawName} (Deal)` : rawName;

      const qty = c.quantity || 1;
      const unitPrice = c.unitPrice ?? itemObj.price ?? (c as any).price ?? 0;
      const price = unitPrice * qty;
      const mainLine = `${qty}x ${displayName} (Rs. ${price.toLocaleString()})`;

      const extras: string[] = [];
      if (c.selectedSize) {
        if (c.selectedSize.startsWith('Option')) {
          extras.push(`Combo Choice: ${c.selectedSize}`);
        } else if (c.selectedSize.includes('piece') || c.selectedSize.includes('Pcs')) {
          extras.push(`Portion/Count: ${c.selectedSize}`);
        } else {
          extras.push(`Size: ${c.selectedSize}`);
        }
      }
      if (c.addOns && c.addOns.length > 0) {
        extras.push(`Add-ons: ${c.addOns.join(', ')}`);
      } else if (c.selectedDip) {
        extras.push(`Dip: ${c.selectedDip}`);
      }
      if (c.notes) {
        extras.push(`Special Prep: ${c.notes}`);
      }

      if (extras.length > 0) {
        return `${mainLine}\n   - ${extras.join(' | ')}`;
      }
      return mainLine;
    })
    .join('\n\n');

  const deliveryFeeDisplay = params.deliveryFee > 0 ? params.deliveryFee.toLocaleString() : '0';

  // Automatically append the user's initial location selection in brackets if not already present
  const initialLoc = (
    params.initialLocation ||
    (typeof window !== 'undefined' ? localStorage.getItem('tendoz_user_selected_area') : '') ||
    ''
  ).trim();
  const cleanLoc = initialLoc.replace(/^\[|\]$/g, '').trim();

  let formattedDeliveryAddress = (params.address || '').trim();
  if (cleanLoc && !formattedDeliveryAddress.includes(`[${cleanLoc}]`)) {
    formattedDeliveryAddress = formattedDeliveryAddress
      ? `${formattedDeliveryAddress} [${cleanLoc}]`
      : `[${cleanLoc}]`;
  }

  let message = `*NEW ORDER RECEIVED* (${timeStr} ${dateStr})
----------------------------------
*Customer:* ${params.userName}
*Phone:* ${params.phone}
*Alt Phone:* ${altPhoneDisplay}
*Order Type:* ${params.orderType}
*Delivery Address:* ${formattedDeliveryAddress}
----------------------------------
*ORDER DETAILS:*

${itemLines}

----------------------------------
*Subtotal:* Rs. ${params.subtotal.toLocaleString()}
*Delivery Fee:* Rs. ${deliveryFeeDisplay}
*TOTAL AMOUNT:* *Rs. ${params.grandTotal.toLocaleString()}*`;

  if (params.specialInstructions && params.specialInstructions.trim()) {
    message += `\n----------------------------------\n*Special Instructions:*\n${params.specialInstructions.trim()}`;
  }

  return message;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  item,
  cartItems = [],
  onBack,
  onConfirmOrder,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  // Local storage keys for customer details persistence & auto-fill
  const SAVED_ADDRESS_STORAGE_KEY = 'tendoz_saved_address';
  const SAVED_NAME_STORAGE_KEY = 'tendoz_saved_customer_name';
  const SAVED_PHONE_STORAGE_KEY = 'tendoz_saved_customer_phone';

  // Form state matching reference screenshot fields with persistent auto-fill
  const [title, setTitle] = useState<'Mr.' | 'Ms.' | 'Mrs.' | 'Dr.'>('Mr.');
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [fullName, setFullName] = useState<string>(() => {
    try {
      return localStorage.getItem(SAVED_NAME_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [mobileNumber, setMobileNumber] = useState<string>(() => {
    try {
      return localStorage.getItem(SAVED_PHONE_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [alternateMobile, setAlternateMobile] = useState('');
  const [address, setAddress] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(SAVED_ADDRESS_STORAGE_KEY);
      if (saved && saved.trim()) return saved.trim();
      const savedArea = localStorage.getItem('tendoz_user_selected_area');
      if (savedArea && savedArea.trim()) return savedArea.trim();
      return '';
    } catch {
      return '';
    }
  });
  const [emailAddress, setEmailAddress] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [changeRequest, setChangeRequest] = useState('');
  const [expandedAddons, setExpandedAddons] = useState<Record<string, boolean>>({});

  // Selected Branch
  const [selectedBranch, setSelectedBranch] = useState<Branch>(AVAILABLE_BRANCHES[0]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  // Validation & submission state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [highlightMissing, setHighlightMissing] = useState(false);
  const [missingFieldsList, setMissingFieldsList] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Items to display in checkout summary
  const displayItems = useMemo(() => {
    if (cartItems && cartItems.length > 0) {
      return cartItems;
    }
    return [
      {
        id: item.id,
        item,
        quantity: 1,
        unitPrice: item.price,
      },
    ];
  }, [cartItems, item]);

  // Financial calculations
  const subtotal = useMemo(() => {
    return displayItems.reduce(
      (sum, cItem) => sum + (cItem.unitPrice ?? cItem.item.price) * cItem.quantity,
      0
    );
  }, [displayItems]);

  const grandTotal = subtotal;

  const toggleAddonsDropdown = (id: string) => {
    setExpandedAddons((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setHighlightMissing(false);
    setMissingFieldsList([]);

    if (displayItems.length === 0) {
      setValidationError('Your cart is empty. Please add items before checking out.');
      return;
    }

    const missing: string[] = [];
    if (!fullName.trim()) missing.push('Full Name');
    if (!mobileNumber.trim()) missing.push('Mobile Number');
    if (!address.trim()) missing.push('Address / Location');

    if (missing.length > 0) {
      setHighlightMissing(true);
      setMissingFieldsList(missing);
      setValidationError(`Please fill in all required fields: ${missing.join(', ')}`);
      return;
    }

    // Persist address locally for auto-fill on next orders
    try {
      localStorage.setItem(SAVED_ADDRESS_STORAGE_KEY, address.trim());
      if (fullName.trim()) localStorage.setItem(SAVED_NAME_STORAGE_KEY, fullName.trim());
      if (mobileNumber.trim()) localStorage.setItem(SAVED_PHONE_STORAGE_KEY, mobileNumber.trim());
    } catch (err) {
      console.warn('Failed to save customer details in localStorage', err);
    }

    setIsSubmitting(true);
    setValidationError(null);

    const fullInstructions = [
      pickupNotes.trim() ? `Notes: ${pickupNotes.trim()}` : '',
      changeRequest.trim() ? `Change Request: ${changeRequest.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const finalSpecialInstructions = fullInstructions.trim() || undefined;

    const customerFullName = `${title} ${fullName.trim()}`;
    const primaryPhone = mobileNumber.trim();
    const secondaryPhone = alternateMobile.trim() || undefined;

    // Resolve user's initial location selection (chosen during first-time onboarding)
    const initialArea = (() => {
      try {
        return (localStorage.getItem('tendoz_user_selected_area') || '').trim();
      } catch {
        return '';
      }
    })();
    const cleanArea = initialArea.replace(/^\[|\]$/g, '').trim();

    // Automatically append the user's initial location selection in brackets if not already present
    let userAddress = address.trim();
    if (cleanArea && !userAddress.includes(`[${cleanArea}]`)) {
      userAddress = userAddress ? `${userAddress} [${cleanArea}]` : `[${cleanArea}]`;
    }

    // Generate dynamic WhatsApp receipt message matching exact prompt structure
    const waText = buildWhatsAppReceiptMessage({
      userName: customerFullName,
      phone: primaryPhone,
      altPhone: secondaryPhone,
      orderType: 'Takeaway',
      address: userAddress,
      initialLocation: cleanArea,
      items: displayItems,
      subtotal,
      deliveryFee: 0,
      grandTotal,
      specialInstructions: finalSpecialInstructions,
    });

    try {
      // Dual Dispatch Step 1: Save complete order payload to Firestore database FIRST
      await onConfirmOrder({
        customerName: customerFullName,
        address: userAddress,
        phone: primaryPhone,
        additionalPhone: secondaryPhone,
        item: displayItems[0].item,
        total: grandTotal,
        email: emailAddress.trim() || undefined,
        specialInstructions: finalSpecialInstructions,
        pickupBranch: selectedBranch.name,
        items: displayItems,
      });

      // Dual Dispatch Step 2: Open pre-filled formatted order message in WhatsApp
      const officialWhatsAppPhone = '923200089000';
      const waUrl = `https://wa.me/${officialWhatsAppPhone}?text=${encodeURIComponent(waText)}`;
      window.open(waUrl, '_blank');
    } catch (err) {
      console.error('Order submission error in checkout:', err);
      setValidationError('Failed to save order to the database. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#F8F9FA] min-h-screen flex flex-col font-sans select-none pb-12">
      {/* =========================================================================
          1. DESKTOP REDESIGNED CHECKOUT LAYOUT (Hidden on mobile < md, active on md+)
          Directly matches the uploaded reference image with Tendoz Red & Yellow theme
         ========================================================================= */}
      <div className="hidden md:block w-full max-w-4xl lg:max-w-5xl mx-auto px-4 py-6">
        {/* Yellow Top Banner & Floating Brand Avatar */}
        <div className="relative bg-[#FFC700] rounded-t-3xl h-16 px-6 flex items-center justify-between border-b border-yellow-400 shadow-2xs">
          {/* Top Left: Phone Pill Badge */}
          <div className="bg-white/95 backdrop-blur-xs text-neutral-900 text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs border border-neutral-200/80">
            <Phone className="w-3.5 h-3.5 text-[#D81A07] fill-[#D81A07]" />
            <span>03200089000</span>
          </div>

          {/* Center Floating Tendoz Brand Avatar */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 z-10">
            <div className="w-16 h-16 rounded-full bg-[#FFC700] p-1 shadow-md border-2 border-white flex items-center justify-center overflow-hidden">
              <img
                src={tendozBrandLogoImg}
                alt="Tendoz Logo"
                className="w-full h-full object-contain rounded-full bg-black/90"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold text-neutral-900 bg-white/95 hover:bg-white px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Back to Menu</span>
          </button>
        </div>

        {/* Main Desktop Card Container */}
        <div className="bg-white rounded-b-3xl border border-neutral-200/90 shadow-sm p-6 lg:p-8 space-y-6">
          {/* Validation Alert */}
          {validationError && (
            <div className="bg-red-50 border border-red-300 rounded-2xl p-4 flex items-start gap-3 text-sm font-bold text-[#D81A07] shadow-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#D81A07]" />
              <div>
                <p className="font-extrabold">{validationError}</p>
                {missingFieldsList.length > 0 && (
                  <p className="text-xs font-medium text-red-700 mt-1">
                    Missing: {missingFieldsList.join(' • ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 1. Branch Location Box */}
          <div className="border border-neutral-200/90 rounded-2xl p-5 bg-neutral-50/50 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-neutral-800">This is a</span>
              <span className="bg-[#D81A07] text-white text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span>TAKEAWAY ORDER</span>
                <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            </div>
            <p className="text-xs text-neutral-600 font-medium">
              You have to collect your order from
            </p>
            <h3 className="font-black text-base text-neutral-900">
              {selectedBranch.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-neutral-600 font-semibold">
              <span>Location: {selectedBranch.addressLine1}, {selectedBranch.addressLine2}</span>
              <button
                type="button"
                onClick={() => setIsBranchModalOpen(true)}
                className="text-[#D81A07] font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer ml-1"
              >
                <span>View Location</span>
                <MapPin className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-neutral-600 font-semibold">
              Phone: 03200089000
            </p>
          </div>

          {/* 2. Customer Details Form */}
          <div className="border border-neutral-200/90 rounded-2xl p-5 lg:p-6 bg-white space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-100/80 text-[#D81A07] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 stroke-[2.4]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-600">This is a</span>
                  <span className="bg-[#FFC700] text-neutral-900 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Pickup Order
                  </span>
                </div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
                  JUST A LAST STEP, PLEASE FILL YOUR INFORMATION BELOW
                </p>
              </div>
            </div>

            {/* Row 1: Title + Full Name */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3 space-y-1 relative">
                <label className="block text-xs font-bold text-neutral-700">Title</label>
                <button
                  type="button"
                  onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
                  className="w-full bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-900 font-bold text-sm px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>{title}</span>
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                </button>
                <AnimatePresence>
                  {isTitleDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-20 py-1"
                    >
                      {(['Mr.', 'Ms.', 'Mrs.', 'Dr.'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setTitle(t);
                            setIsTitleDropdownOpen(false);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-bold text-neutral-800 hover:bg-neutral-50 block cursor-pointer"
                        >
                          {t}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="col-span-9 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-700">Full Name</label>
                  <span className="text-[10px] font-bold text-red-600 uppercase">*Required</span>
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Full Name"
                  className={`w-full px-4 py-2.5 bg-white border ${
                    highlightMissing && !fullName.trim()
                      ? 'border-red-500 ring-2 ring-red-500/20'
                      : 'border-neutral-200 focus:border-[#D81A07]'
                  } rounded-xl text-sm outline-none transition-all`}
                />
              </div>
            </div>

            {/* Row 2: Mobile Number + Alternate Mobile */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-700">Mobile Number</label>
                  <span className="text-[10px] font-bold text-red-600 uppercase">*Required</span>
                </div>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="03xx-xxxxxxx"
                  className={`w-full px-4 py-2.5 bg-white border ${
                    highlightMissing && !mobileNumber.trim()
                      ? 'border-red-500 ring-2 ring-red-500/20'
                      : 'border-neutral-200 focus:border-[#D81A07]'
                  } rounded-xl text-sm outline-none transition-all`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700">
                  Alternate Mobile Number
                </label>
                <input
                  type="tel"
                  value={alternateMobile}
                  onChange={(e) => setAlternateMobile(e.target.value)}
                  placeholder="03xx-xxxxxxx"
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 focus:border-[#D81A07] rounded-xl text-sm outline-none transition-all"
                />
              </div>
            </div>

            {/* Row 3: Address / Location Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-700">Address / Location</label>
                <span className="text-[10px] font-bold text-red-600 uppercase">*Required</span>
              </div>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Enter your street address, house/shop #, area, or landmark"
                className={`w-full px-4 py-2.5 bg-white border ${
                  highlightMissing && !address.trim()
                    ? 'border-red-500 ring-2 ring-red-500/20'
                    : 'border-neutral-200 focus:border-[#D81A07]'
                } rounded-xl text-sm outline-none transition-all`}
              />
            </div>

            {/* Row 4: Pickup Notes */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-neutral-700">Pickup Notes</label>
              <input
                type="text"
                value={pickupNotes}
                onChange={(e) => setPickupNotes(e.target.value)}
                placeholder="Any special notes for pickup"
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 focus:border-[#D81A07] rounded-xl text-sm outline-none transition-all"
              />
            </div>

            {/* Row 5: Email Address */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-neutral-700">Email Address</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 focus:border-[#D81A07] rounded-xl text-sm outline-none transition-all"
              />
            </div>

            {/* Payment Information Section */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Payment Information
              </label>
              <div className="inline-flex items-center gap-2 border-2 border-[#FFC700] bg-yellow-50/40 rounded-2xl p-4 relative cursor-pointer min-w-[200px]">
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#FFC700] text-neutral-900 flex items-center justify-center font-bold">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <span className="font-bold text-sm text-neutral-900">Pay at Pickup</span>
              </div>
            </div>

            {/* Change Request */}
            <div className="space-y-1 pt-1">
              <label className="block text-xs font-bold text-neutral-700">Change Request</label>
              <input
                type="text"
                value={changeRequest}
                onChange={(e) => setChangeRequest(e.target.value)}
                placeholder="Rs. 500"
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 focus:border-[#D81A07] rounded-xl text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* 3. Ordered Products Summary Card */}
          <div className="border border-neutral-200/90 rounded-2xl p-5 bg-white space-y-4">
            <h4 className="font-black text-sm text-neutral-900">
              Ordered Items ({displayItems.reduce((acc, i) => acc + i.quantity, 0)})
            </h4>

            <div className="space-y-3">
              {displayItems.map((cItem, index) => {
                const itemUnitPrice = cItem.unitPrice ?? cItem.item.price;
                const itemTotal = itemUnitPrice * cItem.quantity;
                const itemIdentifier = cItem.id || cItem.item.id;
                const isExpanded = Boolean(expandedAddons[itemIdentifier]);

                return (
                  <div
                    key={`${itemIdentifier}-${index}`}
                    className="border border-neutral-200/80 rounded-2xl p-3.5 bg-neutral-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-neutral-200 shrink-0">
                          <img
                            src={normalizeImageUrl(cItem.item.image)}
                            alt={cItem.item.name}
                            onError={handleImageError}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h5 className="font-black text-sm text-neutral-900">
                            {cItem.quantity}x {cItem.item.name}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-extrabold text-sm text-[#D81A07]">
                              Rs. {itemTotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* View Add-ons Dropdown Toggle */}
                      {cItem.addOns && cItem.addOns.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleAddonsDropdown(itemIdentifier)}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
                        >
                          <span>View Add-ons</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Expandable Add-ons List */}
                    <AnimatePresence>
                      {isExpanded && cItem.addOns && cItem.addOns.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2 border-t border-neutral-200/60 space-y-1"
                        >
                          <span className="text-[11px] font-bold text-neutral-500 uppercase">
                            Included Add-ons:
                          </span>
                          <ul className="text-xs font-semibold text-neutral-700 space-y-0.5 pl-2">
                            {cItem.addOns.map((addon, aIdx) => (
                              <li key={aIdx} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D81A07]" />
                                <span>{addon}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Bill Totals Breakdown */}
            <div className="bg-neutral-50 rounded-2xl p-4 space-y-2.5 border border-neutral-200/80">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-600">
                <span>Total</span>
                <span className="text-neutral-900">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-neutral-600">
                <span>Tax (16%)</span>
                <span className="text-neutral-900">Rs. 0</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>Discount</span>
                <span>- Rs. 0</span>
              </div>
              <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                <span className="font-black text-sm text-neutral-900">Grand Total</span>
                <span className="font-black text-lg text-[#FFC700] drop-shadow-2xs">
                  Rs. {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Promo Savings Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-center gap-2 text-xs font-bold text-emerald-700">
              <Flame className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>Yay! You're saving big on this signature order</span>
            </div>

            {/* Place Order CTA Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || displayItems.length === 0}
              className="w-full py-4 bg-[#FFC700] hover:bg-[#ffe033] active:bg-[#e6b200] text-neutral-950 font-black text-base rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
              <span>{isSubmitting ? 'Placing Order...' : 'Place Order'}</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full text-center text-xs font-bold text-amber-700 hover:underline cursor-pointer block"
            >
              &larr; continue to add more items
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. MOBILE CHECKOUT LAYOUT (Mobile View - exact unchanged design)
         ========================================================================= */}
      <div className="md:hidden flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 pt-5 pb-8 space-y-4">
        {/* Page Title & Back Arrow */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            aria-label="Back to Menu"
            title="Back to Menu"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.4]" />
          </button>
          <h1 className="text-2xl sm:text-[28px] font-black text-neutral-900 tracking-tight">
            Checkout
          </h1>
        </div>

        {/* Notice Card: 'This is a SELF PICKUP ORDER' */}
        <div className="border border-neutral-800 rounded-3xl p-4 sm:p-4.5 flex items-start gap-3.5 bg-white shadow-2xs">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-red-50 border border-red-200/80 flex items-center justify-center text-[#D81A07] shrink-0 mt-0.5">
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-neutral-800">This is a</span>
              <span className="bg-[#B91C1C] text-white text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                SELF PICKUP ORDER
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-neutral-600 mt-1 font-medium leading-snug">
              Just a last step, please enter your details for pickup:
            </p>
          </div>
        </div>

        {/* Customer Details Form Container Card */}
        <div className="border border-neutral-200/80 bg-white rounded-3xl p-4 sm:p-5 space-y-4 shadow-xs">
          {/* Validation Alert */}
          {validationError && (
            <div className="bg-red-50 border border-red-300 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs sm:text-sm font-bold text-[#D81A07] shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#D81A07]" />
              <div>
                <p className="font-extrabold">{validationError}</p>
                {missingFieldsList.length > 0 && (
                  <p className="text-[11px] font-medium text-red-700 mt-0.5">
                    Missing: {missingFieldsList.join(' • ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Title Selector */}
          <div className="space-y-1.5 relative">
            <label className="block text-sm font-bold text-neutral-800">
              Title
            </label>
            <button
              type="button"
              onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
              className="w-full bg-[#B91C1C] hover:bg-[#991B1B] text-white font-bold text-sm sm:text-base px-4 py-3 rounded-2xl flex items-center justify-between cursor-pointer transition-colors shadow-xs"
            >
              <span>{title}</span>
              <ChevronDown
                className={`w-4 h-4 text-white transition-transform duration-200 ${
                  isTitleDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isTitleDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden z-20 py-1"
                >
                  {(['Mr.', 'Ms.', 'Mrs.', 'Dr.'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTitle(t);
                        setIsTitleDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-bold flex items-center justify-between hover:bg-neutral-50 transition-colors cursor-pointer ${
                        title === t ? 'text-[#B91C1C] bg-red-50/50' : 'text-neutral-700'
                      }`}
                    >
                      <span>{t}</span>
                      {title === t && <Check className="w-4 h-4 text-[#B91C1C]" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Full Name Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-neutral-800">
                Full Name
              </label>
              <span className="text-[11px] font-black text-[#D81A07] tracking-wider uppercase">
                *REQUIRED
              </span>
            </div>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (validationError) {
                  setValidationError(null);
                  setHighlightMissing(false);
                }
              }}
              placeholder="Full Name"
              className={`w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-50/80 focus:bg-white border ${
                highlightMissing && !fullName.trim()
                  ? 'border-red-500 ring-2 ring-red-500/20'
                  : 'border-neutral-200 focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20'
              } rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all`}
            />
          </div>

          {/* Mobile Number Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-neutral-800">
                Mobile Number
              </label>
              <span className="text-[11px] font-black text-[#D81A07] tracking-wider uppercase">
                *REQUIRED
              </span>
            </div>
            <input
              type="tel"
              required
              value={mobileNumber}
              onChange={(e) => {
                setMobileNumber(e.target.value);
                if (validationError) {
                  setValidationError(null);
                  setHighlightMissing(false);
                }
              }}
              placeholder="03xx-xxxxxxx"
              className={`w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-50/80 focus:bg-white border ${
                highlightMissing && !mobileNumber.trim()
                  ? 'border-red-500 ring-2 ring-red-500/20'
                  : 'border-neutral-200 focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20'
              } rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all`}
            />
          </div>

          {/* Alternate Mobile Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-neutral-800 block">
              Alternate Mobile Number
            </label>
            <input
              type="tel"
              value={alternateMobile}
              onChange={(e) => setAlternateMobile(e.target.value)}
              placeholder="03xx-xxxxxxx or +92 3xx-xxxxxxx"
              className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-50/80 focus:bg-white border border-neutral-200 focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all"
            />
          </div>

          {/* Address / Location Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-neutral-800">
                Address / Location
              </label>
              <span className="text-[11px] font-black text-[#D81A07] tracking-wider uppercase">
                *REQUIRED
              </span>
            </div>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (validationError) {
                  setValidationError(null);
                  setHighlightMissing(false);
                }
              }}
              placeholder="Enter your street address, house/shop #, area, or landmark"
              className={`w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-50/80 focus:bg-white border ${
                highlightMissing && !address.trim()
                  ? 'border-red-500 ring-2 ring-red-500/20'
                  : 'border-neutral-200 focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20'
              } rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all`}
            />
          </div>

          {/* Pickup Branch Location Box */}
          <div className="border border-neutral-800 rounded-3xl p-3.5 sm:p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D81A07] stroke-[2.4]" />
                <span className="font-bold text-sm text-neutral-900">
                  Pickup Branch Location
                </span>
              </div>
              <span className="bg-red-100 text-[#D81A07] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                SELF PICKUP
              </span>
            </div>

            <div className="bg-red-50/50 border border-red-100/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-sm sm:text-base text-neutral-900">
                  {selectedBranch.name}
                </h4>
                <p className="text-xs text-neutral-700 mt-0.5 leading-snug font-semibold">
                  Near Pilot Girls School, Sahiwal, Punjab
                </p>
              </div>

              <div className="bg-white border border-red-200/90 text-[#D81A07] text-[11px] font-black px-3 py-1.5 rounded-xl self-start sm:self-auto uppercase tracking-wider shrink-0 shadow-2xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>OFFICIAL BRANCH</span>
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-neutral-800 block">
              Email Address
            </label>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-50/80 focus:bg-white border border-neutral-200 focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all"
            />
          </div>

          {/* Special Instructions */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-neutral-800 block">
              Special Instructions
            </label>
            <input
              type="text"
              value={pickupNotes}
              onChange={(e) => setPickupNotes(e.target.value)}
              placeholder="Any special requests or instructions"
              className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-50/80 focus:bg-white border border-neutral-200 focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* PAYMENT INFORMATION Section */}
        <div className="space-y-2.5 pt-1">
          <h3 className="font-black text-xs sm:text-sm text-neutral-900 tracking-wider uppercase">
            PAYMENT INFORMATION
          </h3>

          <div className="flex items-center gap-3">
            <div className="border-2 border-[#B91C1C] bg-red-50/40 rounded-2xl p-3.5 sm:p-4 w-44 sm:w-48 relative flex flex-col items-center justify-center text-center cursor-pointer shadow-xs select-none">
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#B91C1C] text-white flex items-center justify-center shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <div className="w-9 h-9 rounded-full bg-red-100/90 text-[#B91C1C] flex items-center justify-center mb-1.5">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-neutral-900">
                Cash on Delivery
              </span>
            </div>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="border border-neutral-200/80 bg-white rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
            <h3 className="font-black text-sm text-neutral-900 tracking-tight">
              Order Summary ({displayItems.reduce((acc, i) => acc + i.quantity, 0)} items)
            </h3>
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-bold text-[#D81A07] hover:underline cursor-pointer"
            >
              + Add More
            </button>
          </div>

          <div className="space-y-3">
            {displayItems.map((cItem, index) => {
              const itemUnitPrice = cItem.unitPrice ?? cItem.item.price;
              const itemTotal = itemUnitPrice * cItem.quantity;
              const itemIdentifier = cItem.id || cItem.item.id;

              return (
                <div
                  key={`${itemIdentifier}-${index}`}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-neutral-50/60 border border-neutral-200/60"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 shadow-2xs">
                      <img
                        src={normalizeImageUrl(cItem.item.image)}
                        alt={cItem.item.name}
                        onError={handleImageError}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-xs sm:text-sm text-neutral-900 truncate">
                        {cItem.item.name}
                      </h4>
                      {cItem.addOns && cItem.addOns.length > 0 && (
                        <p className="text-[11px] text-neutral-600 font-medium truncate leading-tight mt-0.5">
                          <span className="text-[#D81A07] font-bold">+ Extras:</span>{' '}
                          {cItem.addOns.join(', ')}
                        </p>
                      )}
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-extrabold text-xs sm:text-sm text-[#D81A07]">
                          Rs. {itemTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {onUpdateQuantity && onRemoveItem && (
                    <div className="shrink-0 flex items-center gap-1.5">
                      <div className="flex items-center gap-1.5 bg-white border border-neutral-200/90 rounded-full px-2 py-1 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => {
                            if (cItem.quantity === 1) {
                              onRemoveItem(itemIdentifier);
                            } else {
                              onUpdateQuantity(itemIdentifier, -1);
                            }
                          }}
                          className="text-[#D81A07] cursor-pointer p-0.5"
                        >
                          {cItem.quantity === 1 ? (
                            <Trash2 className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3 stroke-[2.8]" />
                          )}
                        </button>
                        <span className="font-bold text-xs text-[#D81A07] min-w-[14px] text-center">
                          {cItem.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(itemIdentifier, 1)}
                          className="text-[#D81A07] cursor-pointer p-0.5"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-neutral-50/90 rounded-2xl p-3.5 space-y-2.5 border border-neutral-100">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-neutral-700">Total</span>
              <span className="font-bold text-neutral-900">Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-neutral-700">Free Delivery</span>
              <span className="font-bold text-neutral-900">Free</span>
            </div>
            <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between">
              <span className="font-black text-sm text-neutral-900">Grand Total</span>
              <span className="font-black text-base text-[#D81A07]">
                Rs. {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY 'PLACE ORDER' BAR (Mobile View Only) */}
      <div className="md:hidden sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-40 shrink-0">
        <div className="max-w-xl mx-auto w-full">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || displayItems.length === 0}
            className="w-full py-3.5 px-6 bg-[#B91C1C] hover:bg-[#991B1B] active:scale-[0.99] disabled:opacity-50 text-white font-black rounded-2xl transition-all cursor-pointer text-sm flex items-center justify-between shadow-md"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 stroke-[2.4]" />
                  <span>Place Order</span>
                </div>
                <span className="text-sm font-black">
                  Rs. {grandTotal.toLocaleString()}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full text-center text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer block mt-2.5 py-0.5"
          >
            &larr; continue to add more items
          </button>
        </div>
      </div>

      {/* Branch Selection Modal */}
      <AnimatePresence>
        {isBranchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBranchModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl relative border border-neutral-100 z-10 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#D81A07]" />
                  <h3 className="font-black text-base text-neutral-900">
                    Select Pickup Branch
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              <div className="space-y-2.5">
                {AVAILABLE_BRANCHES.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedBranch(b);
                      setIsBranchModalOpen(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      selectedBranch.id === b.id
                        ? 'border-[#B91C1C] bg-red-50/50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-neutral-900">
                        {b.name}
                      </h4>
                      <p className="text-xs text-neutral-600 mt-0.5 font-medium">
                        {b.addressLine1}, {b.addressLine2}
                      </p>
                    </div>
                    {selectedBranch.id === b.id && (
                      <div className="w-5 h-5 rounded-full bg-[#B91C1C] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
