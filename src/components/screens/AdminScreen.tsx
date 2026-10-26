import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Flame,
  Plus,
  Edit2,
  Trash2,
  Database,
  RefreshCw,
  Search,
  X,
  Sparkles,
  Layers,
  Tag,
  Clock,
  FlameKindling,
  DollarSign,
  AlertTriangle,
  ArrowUpDown,
  ArrowLeft,
} from 'lucide-react';
import { MenuItem } from '../../types';
import { MenuItemFormModal } from '../MenuItemFormModal';
import { motion, AnimatePresence } from 'motion/react';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';

interface AdminScreenProps {
  items: MenuItem[];
  onAddItem: (item: Partial<MenuItem>) => Promise<void> | void;
  onEditItem: (id: string, item: Partial<MenuItem>) => Promise<void> | void;
  onDeleteItem: (id: string) => Promise<void> | void;
  onSelectItem: (item: MenuItem) => void;
  onSyncToFirestore?: () => Promise<void>;
  isSyncing?: boolean;
  onBack?: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onSelectItem,
  onSyncToFirestore,
  isSyncing = false,
  onBack,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc' | 'popular'>('popular');
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Distinct Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ['All', ...Array.from(set)];
  }, [items]);

  // Filtered & Sorted Items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.tag && item.tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'popular') return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
      return 0;
    });

    return result;
  }, [items, searchQuery, selectedCategory, sortBy]);

  // KPI Metrics Calculation
  const averagePrice = useMemo(() => {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, curr) => acc + (curr.price || 0), 0);
    return Math.round(sum / items.length);
  }, [items]);

  const featuredCount = useMemo(() => {
    return items.filter((i) => i.isPopular || (i.tag && i.tag.length > 0)).length;
  }, [items]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handlePromptDelete = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteItem(itemToDelete.id);
      setItemToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (itemData: Partial<MenuItem>) => {
    if (editingItem) {
      await onEditItem(editingItem.id, itemData);
    } else {
      await onAddItem(itemData);
    }
  };

  const handleTogglePopular = async (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPopular = !item.isPopular;
    await onEditItem(item.id, { isPopular: nextPopular });
  };

  return (
    <div className="w-full bg-[#F8F9FA] min-h-screen pb-24 text-neutral-900 select-none">
      {/* Top Bright Header */}
      <div className="bg-white border-b border-neutral-200/90 shadow-2xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Title & Brand with Back Button */}
            <div className="flex items-center gap-3 sm:gap-3.5">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-neutral-100 hover:bg-neutral-200/80 active:scale-95 border border-neutral-200/90 text-neutral-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0 group"
                  aria-label="Back to main app"
                  title="Back to Tendoz Menu"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5] text-neutral-700 group-hover:text-black transition-colors" />
                </button>
              )}

              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#D81A07] rounded-2xl flex items-center justify-center text-white shadow-md shadow-red-600/25 shrink-0">
                <Flame className="w-6 h-6 fill-white stroke-[2.2]" />
              </div>
              <div>
                <h1 className="font-black text-xl sm:text-2xl text-neutral-950 tracking-tight leading-tight">
                  Tendoz Menu Admin
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
                  Real-time product catalog management &amp; instant customer sync.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {onSyncToFirestore && (
                <button
                  type="button"
                  onClick={() => onSyncToFirestore()}
                  disabled={isSyncing}
                  className="py-2.5 px-3.5 sm:px-4 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-700 font-bold rounded-2xl transition-all border border-neutral-200/90 shadow-2xs cursor-pointer text-xs sm:text-sm flex items-center gap-2 disabled:opacity-60"
                  title="Force re-sync menu catalog"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-[#D81A07] ${isSyncing ? 'animate-spin' : ''}`}
                  />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Catalog'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenAdd}
                className="py-2.5 px-4 sm:px-5 bg-[#D81A07] hover:bg-[#b81505] active:scale-98 text-white font-black rounded-2xl transition-all shadow-md shadow-[#D81A07]/25 cursor-pointer text-xs sm:text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add New Dish</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-7">

        {/* 4 Bright KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {/* Card 1: Active Menu Dishes */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs space-y-2 hover:border-red-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Total Dishes
              </span>
              <div className="w-9 h-9 rounded-xl bg-red-50 text-[#D81A07] flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 stroke-[2.4]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-neutral-950 tabular-nums">
              {items.length}
            </div>
            <div className="text-[11px] font-semibold text-neutral-500">
              Active in restaurant catalog
            </div>
          </div>

          {/* Card 2: Categories */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs space-y-2 hover:border-amber-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Categories
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Layers className="w-4 h-4 stroke-[2.4]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-neutral-950 tabular-nums">
              {categories.length - 1}
            </div>
            <div className="text-[11px] font-semibold text-neutral-500">
              Menu categories organized
            </div>
          </div>

          {/* Card 3: Featured & Specials */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs space-y-2 hover:border-red-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Featured Specials
              </span>
              <div className="w-9 h-9 rounded-xl bg-red-50 text-[#D81A07] flex items-center justify-center">
                <Sparkles className="w-4 h-4 stroke-[2.4]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-neutral-950 tabular-nums">
              {featuredCount}
            </div>
            <div className="text-[11px] font-semibold text-neutral-500">
              Marked popular or tagged
            </div>
          </div>

          {/* Card 4: Average Menu Price */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs space-y-2 hover:border-emerald-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Average Price
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4 stroke-[2.4]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-neutral-950 tabular-nums">
              Rs. {averagePrice.toLocaleString()}
            </div>
            <div className="text-[11px] font-semibold text-neutral-500">
              Across all menu items
            </div>
          </div>
        </div>

        {/* Filter, Search & Sort Control Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dish by title, tag, or description..."
                className="w-full pl-10 pr-9 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200/90 focus:border-[#D81A07] focus:ring-2 focus:ring-[#D81A07]/20 rounded-2xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-2 px-3 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-800 outline-none focus:border-[#D81A07] cursor-pointer"
              >
                <option value="popular">Most Popular First</option>
                <option value="name">Dish Name (A-Z)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
            {categories.map((cat) => {
              const count =
                cat === 'All'
                  ? items.length
                  : items.filter((i) => i.category === cat).length;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#D81A07] text-white shadow-xs scale-102'
                      : 'bg-neutral-100 hover:bg-neutral-200/70 text-neutral-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white text-neutral-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Catalog Grid (Bright, Modern Cards) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-extrabold text-base sm:text-lg text-neutral-950 tracking-tight">
              Product Catalog ({filteredItems.length} {filteredItems.length === 1 ? 'Dish' : 'Dishes'})
            </h2>
            <span className="text-xs font-semibold text-neutral-500">
              Click any card to preview in Customer View
            </span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200/90 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#D81A07] flex items-center justify-center mx-auto">
                <UtensilsCrossed className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="font-extrabold text-base text-neutral-900">
                No matching dishes found
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                No menu items match your search or category filter. Try clearing filters or adding a new dish.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              <AnimatePresence>
                {filteredItems.map((item) => {
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => onSelectItem(item)}
                      className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/90 shadow-2xs hover:shadow-md hover:border-red-200/90 transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                    >
                      {/* Top Row: Thumbnail + Core Info */}
                      <div className="space-y-3.5">
                        <div className="flex items-start gap-3.5">
                          {/* Dish Image Thumbnail */}
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#FFAE00]/10 border border-neutral-200/90 overflow-hidden shrink-0 shadow-2xs group-hover:scale-102 transition-transform">
                            <img
                              src={normalizeImageUrl(item.image)}
                              alt={item.name}
                              onError={handleImageError}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {item.isPopular && (
                              <span className="absolute top-1 left-1 bg-[#FFC700] text-black font-black text-[9px] px-1.5 py-0.5 rounded shadow-2xs uppercase">
                                Popular
                              </span>
                            )}
                          </div>

                          {/* Titles & Meta */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D81A07] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                {item.category}
                              </span>
                              {item.tag && (
                                <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                                  {item.tag}
                                </span>
                              )}
                            </div>

                            <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 group-hover:text-[#D81A07] transition-colors leading-snug truncate">
                              {item.name}
                            </h3>

                            {/* Clean Price */}
                            <div className="flex items-baseline gap-2 mt-1.5">
                              <span className="text-base sm:text-lg font-black text-neutral-950">
                                Rs. {item.price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="text-xs text-neutral-500 font-medium line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {/* Badges / Specs Pill Row */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-neutral-600 pt-1 border-t border-neutral-100">
                          {item.prepTime && (
                            <span className="inline-flex items-center gap-1 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200/70 font-semibold text-neutral-600">
                              <Clock className="w-3 h-3 text-neutral-400" />
                              {item.prepTime}
                            </span>
                          )}
                          {item.calories ? (
                            <span className="inline-flex items-center gap-1 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200/70 font-semibold text-neutral-600">
                              <FlameKindling className="w-3 h-3 text-[#D81A07]" />
                              {item.calories} kcal
                            </span>
                          ) : null}
                          {item.spiceLevel && item.spiceLevel !== 'None' && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                              {item.spiceLevel} Spice
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Action Controls: Edit & Delete */}
                      <div className="pt-3.5 mt-3.5 border-t border-neutral-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-neutral-400 truncate max-w-[120px]">
                          ID: {item.id}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Dynamic Popular Badge Toggle */}
                          <button
                            type="button"
                            onClick={(e) => handleTogglePopular(item, e)}
                            className={`py-1.5 px-2.5 sm:px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                              item.isPopular
                                ? 'bg-[#FFC700] hover:bg-[#ffbe26] text-black border-[#e6b300] shadow-2xs'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-neutral-200/80'
                            }`}
                            title={item.isPopular ? 'Remove Popular badge' : 'Assign Popular badge'}
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${item.isPopular ? 'text-black fill-black' : 'text-neutral-400'}`} />
                            <span>{item.isPopular ? 'Popular' : 'Mark Popular'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(item, e)}
                            className="py-1.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Edit Title, Price, Image or Description"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handlePromptDelete(item, e)}
                            className="py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-[#B91C1C] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200/80"
                            title="Delete dish permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#B91C1C]" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Add Menu Item Form Modal */}
      <MenuItemFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialItem={editingItem}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setItemToDelete(null)}
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
                  Delete Dish from Menu?
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Are you sure you want to permanently remove <strong className="text-neutral-900">"{itemToDelete.name}"</strong>?
                  This action immediately removes the item from your restaurant menu.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 px-4 bg-[#B91C1C] hover:bg-[#991B1B] text-white font-bold rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
