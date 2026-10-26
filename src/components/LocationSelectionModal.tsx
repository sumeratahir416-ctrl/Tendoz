import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X as CloseIcon,
  MapPin as MapPinIcon,
  Building,
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  Search as SearchIcon,
} from 'lucide-react';
import { tendozBrandLogoImg } from '../data/initialData';

export const SAHIWAL_AREAS = [
  'Al Razaq Royals',
  'Arif Wala Bypass',
  'Baba Farid Park Housing Society',
  'Barkat Town',
  'Bhutto Nagar',
  'Bilal Colony',
  'Canal Colony',
  'Canal View Town',
  'Chak 82/6R',
  'Chak 85/6R',
  'Chak 86/6-R',
  'COMSATS University Sahiwal',
  'DHQ Hospital',
  'Dosehra Ground',
  'Dubai Gardens',
  'Farid Town',
  'Fateh Sher Colony',
  'Five Ways Chowk',
  'Friends Theater',
  'Ganj Sakar Colony',
  'Ghalla Mandi',
  'Girls College Road',
  'Global Villas',
  'Green Town',
  'Gulshan e Ali Housing Scheme',
  'Gulshan e Noor Housing Scheme, Multan Road',
  'Gulshan e Noor Town',
  'Haris Block',
  'Haseeb Town',
  'Hussain Colony',
  'Jahaz Ground',
  'Jail Road',
  'Jeevan City Phase 1',
  'Jeevan City Phase 2, 4 & 5',
  'Jeewan Avenue',
  'Jeewan City Phase III',
  'Jhall Road',
  'Jinnah Hall',
  'Johar Town',
  'Kot Khadim Ali Shah',
  'Labour Colony',
  'Lalazar Colony',
  'Mazdoor Pull',
  'Mohalla Noor Park',
  'Muslim Bin Aqeel Colony',
  'Nai Abadi',
  'Officers Colony',
  'Pak Avenue Housing Scheme',
  'Pakpattan Chowk',
  'Pull Bazar',
  'Rafi Garden',
  'Razzaq Villas Housing Scheme',
  'Royal Palm City',
  'Saeed Ullah Mokal Colony',
  'Sahiwal International Hospital',
  'Shadab Town',
  'Shadman Town',
  'Shah Din',
  'Shuja Town',
  'Silver City',
  'Tariq Bin Ziad Colony',
  'University of Sahiwal',
  'Zaildar Colony',
] as const;

export const SAHIWAL_BRANCHES = [
  'Tendoz Main Boulevard Sahiwal (Near Pilot Girls School)',
] as const;

export interface UserLocationSelection {
  orderType: 'Delivery' | 'Pick-Up';
  city: string;
  area: string;
  branch: string;
}

interface LocationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (selection: UserLocationSelection) => void;
  initialSelection?: Partial<UserLocationSelection>;
  allowCloseWithoutSelect?: boolean;
}

export const LocationSelectionModal: React.FC<LocationSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialSelection,
  allowCloseWithoutSelect = true,
}) => {
  const [orderType, setOrderType] = useState<'Delivery' | 'Pick-Up'>(
    initialSelection?.orderType || 'Delivery'
  );
  const [selectedArea, setSelectedArea] = useState<string>(
    initialSelection?.area || ''
  );
  const [selectedBranch, setSelectedBranch] = useState<string>(
    initialSelection?.branch || SAHIWAL_BRANCHES[0]
  );
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');

  useEffect(() => {
    if (initialSelection) {
      if (initialSelection.orderType) setOrderType(initialSelection.orderType);
      if (initialSelection.area) setSelectedArea(initialSelection.area);
      if (initialSelection.branch) setSelectedBranch(initialSelection.branch);
    }
  }, [initialSelection, isOpen]);

  const filteredAreas = React.useMemo(() => {
    const query = areaSearchQuery.trim().toLowerCase();
    if (!query) return SAHIWAL_AREAS;
    return SAHIWAL_AREAS.filter((area) =>
      area.toLowerCase().includes(query)
    );
  }, [areaSearchQuery]);

  if (!isOpen) return null;

  const isFormValid =
    orderType === 'Delivery' ? Boolean(selectedArea.trim()) : Boolean(selectedBranch.trim());

  const handleConfirm = () => {
    if (!isFormValid) return;
    const finalArea = orderType === 'Delivery' ? selectedArea : SAHIWAL_BRANCHES[0];
    const selection: UserLocationSelection = {
      orderType,
      city: 'Sahiwal',
      area: finalArea,
      branch: selectedBranch || SAHIWAL_BRANCHES[0],
    };

    // Store in persistent local memory
    try {
      localStorage.setItem('tendoz_user_selected_area', finalArea);
      localStorage.setItem('tendoz_user_order_type', orderType);
      localStorage.setItem('tendoz_user_selected_branch', selectedBranch || SAHIWAL_BRANCHES[0]);
    } catch {}

    onSelectLocation(selection);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs select-none">
        {/* Backdrop dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (allowCloseWithoutSelect) onClose();
          }}
          className="absolute inset-0"
        />

        {/* Modal Card directly matching reference design screenshots */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[92vh] my-auto z-10"
        >
          {/* Top Close 'X' Button if allowed */}
          {allowCloseWithoutSelect && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer z-20"
              title="Close"
              aria-label="Close modal"
            >
              <CloseIcon className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          {/* Centered Brand Avatar Logo - Object Cover with zero silver space */}
          <div className="flex flex-col items-center justify-center pt-1 pb-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-md flex items-center justify-center mb-2 bg-[#D81A07]">
              <img
                src={tendozBrandLogoImg}
                alt="Tendoz Restaurant"
                width="80"
                height="80"
                decoding="async"
                className="w-full h-full object-cover block"
              />
            </div>
            <span className="text-[11px] font-black tracking-widest text-[#D81A07] uppercase">
              Tendoz Sahiwal
            </span>
          </div>

          <div className="space-y-4 overflow-visible flex-1">
            {/* 1. Select Your Order Type Header & Pills */}
            <div className="text-center space-y-2">
              <h3 className="text-base sm:text-lg font-black text-neutral-950 tracking-tight">
                Select your order type
              </h3>

              {/* Order Type Toggle Pills (Delivery vs Pick-Up) */}
              <div className="inline-flex items-center p-1 rounded-full bg-neutral-100 border border-neutral-200/80 gap-1">
                <button
                  type="button"
                  onClick={() => setOrderType('Delivery')}
                  className={`px-6 py-2 rounded-full font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
                    orderType === 'Delivery'
                      ? 'bg-[#D81A07] text-white shadow-xs'
                      : 'text-neutral-700 hover:text-neutral-900 bg-transparent'
                  }`}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('Pick-Up')}
                  className={`px-6 py-2 rounded-full font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
                    orderType === 'Pick-Up'
                      ? 'bg-[#D81A07] text-white shadow-xs'
                      : 'text-neutral-700 hover:text-neutral-900 bg-transparent'
                  }`}
                >
                  Pick-Up
                </button>
              </div>
            </div>

            {/* Prompt Header */}
            <div className="text-center pt-1">
              <p className="text-xs font-bold text-neutral-600">
                {orderType === 'Delivery'
                  ? 'Please select your delivery location'
                  : 'Which outlet would you like to pick-up from?'}
              </p>
            </div>

            {/* 2. Select City / Region (Read-Only Pill) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-neutral-800">
                Select City / Region
              </label>
              <div className="w-full bg-neutral-50 border-2 border-neutral-200 rounded-full px-5 py-3 text-xs sm:text-sm font-bold text-neutral-900 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-[#D81A07] shrink-0" />
                  <span>Sahiwal</span>
                </div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-neutral-200/70 px-2.5 py-0.5 rounded-full">
                  Active
                </span>
              </div>
            </div>

            {/* 3. Select Area / Sub Region Dropdown (Delivery Mode) */}
            {orderType === 'Delivery' ? (
              <div className="space-y-2 relative">
                <label className="block text-xs font-extrabold text-neutral-800">
                  Select Area / Sub Region
                </label>

                {/* Area Dropdown Button Styled as Pill with Smooth Bright-Red Border */}
                <button
                  type="button"
                  onClick={() => setIsAreaDropdownOpen((prev) => !prev)}
                  className={`w-full bg-white border-2 border-[#D81A07] rounded-full px-5 py-3.5 sm:py-4 text-xs sm:text-sm text-left flex items-center justify-between gap-3 transition-all cursor-pointer shadow-xs hover:bg-red-50/20 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#D81A07]/30 ${
                    isAreaDropdownOpen ? 'ring-2 ring-[#D81A07]/30 shadow-md' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-1">
                    <MapPinIcon className="w-4 h-4 text-[#D81A07] shrink-0" />
                    <span
                      className={`whitespace-normal break-words leading-snug flex-1 min-w-0 ${
                        !selectedArea ? 'text-neutral-400 font-medium' : 'text-neutral-900 font-extrabold'
                      }`}
                    >
                      {selectedArea || 'Select your area / sub-area'}
                    </span>
                  </div>
                  <ChevronDownIcon
                    className={`w-4 h-4 text-[#D81A07] transition-transform duration-200 shrink-0 ${
                      isAreaDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Backdrop overlay to close upward dropdown on outside tap */}
                {isAreaDropdownOpen && (
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsAreaDropdownOpen(false)}
                  />
                )}

                {/* Dropdown Menu opening UPWARD above input field with Clean Text List (No Red Pill Fills) */}
                {isAreaDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.99 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 bottom-full mb-2 bg-white border border-neutral-200 rounded-2xl shadow-2xl z-40 overflow-hidden flex flex-col max-h-60 sm:max-h-64"
                  >
                    {/* Quick Search Filter Bar */}
                    <div className="p-2.5 border-b border-neutral-100 bg-neutral-50/90 shrink-0">
                      <div className="relative">
                        <SearchIcon className="w-3.5 h-3.5 text-[#D81A07] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={areaSearchQuery}
                          onChange={(e) => setAreaSearchQuery(e.target.value)}
                          placeholder="Type Subarea"
                          className="w-full bg-white border border-neutral-200 focus:border-[#D81A07] rounded-lg pl-8 pr-7 py-2 text-xs font-semibold text-neutral-800 placeholder:text-neutral-400 outline-none transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                        {areaSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setAreaSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Clean, Readable List of Areas - NO SOLID RED BACKGROUND PILLS */}
                    <div className="overflow-y-auto divide-y divide-neutral-100 flex-1">
                      {filteredAreas.length > 0 ? (
                        filteredAreas.map((area) => {
                          const isSelected = selectedArea === area;
                          return (
                            <button
                              key={area}
                              type="button"
                              onClick={() => {
                                setSelectedArea(area);
                                setIsAreaDropdownOpen(false);
                                setAreaSearchQuery('');
                              }}
                              className={`w-full text-left px-4 py-3 text-xs sm:text-sm flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                                isSelected
                                  ? 'bg-neutral-50 text-[#D81A07] font-bold'
                                  : 'text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 font-medium'
                              }`}
                            >
                              <span className="whitespace-normal break-words leading-snug flex-1 pr-1">
                                {area}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`text-[11px] sm:text-xs font-normal ${
                                    isSelected ? 'text-[#D81A07]/80 font-medium' : 'text-neutral-400'
                                  }`}
                                >
                                  ~ eta 50 min.
                                </span>
                                {isSelected && (
                                  <CheckIcon className="w-4 h-4 text-[#D81A07] stroke-[2.5] shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="py-6 text-center text-xs text-neutral-500 font-medium">
                          No area matches &ldquo;{areaSearchQuery}&rdquo;
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              /* Select Branch Dropdown (Pick-Up Mode) */
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-neutral-800">
                  Select Branch
                </label>
                <div className="w-full bg-red-50/20 border-2 border-[#D81A07] rounded-full px-5 py-3 text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-2.5 shadow-2xs">
                  <Building className="w-4 h-4 text-[#D81A07] shrink-0" />
                  <span className="leading-snug break-words whitespace-normal flex-1">
                    {SAHIWAL_BRANCHES[0]}
                  </span>
                </div>
              </div>
            )}

            {/* 4. Action 'Select' Button matching reference screenshots */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!isFormValid}
                onClick={handleConfirm}
                className={`w-full py-3.5 sm:py-4 px-4 rounded-full font-black text-sm sm:text-base tracking-tight transition-all duration-200 shadow-md ${
                  isFormValid
                    ? 'bg-[#D81A07] hover:bg-[#b81505] active:scale-[0.99] text-white shadow-red-600/25 cursor-pointer'
                    : 'bg-[#CCCCCC] text-[#8E8E8E] cursor-not-allowed shadow-none border-none'
                }`}
              >
                Select
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
