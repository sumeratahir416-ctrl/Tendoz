import React, { useState, useEffect } from 'react';
import { X, UtensilsCrossed, Image as ImageIcon, Sparkles } from 'lucide-react';
import { MenuItem } from '../types';
import { motion } from 'motion/react';
import { normalizeImageUrl, handleImageError } from '../utils/imageUtils';

interface MenuItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<MenuItem>) => void;
  initialItem?: MenuItem | null;
}

const MENU_CATEGORIES: Array<MenuItem['category']> = [
  'Popular',
  'Pizzas',
  'Burgers',
  'Deals',
  'Appetizers',
  'Fried Chicken',
  'Injected Broast',
  'Wraps',
  'Pastas',
  'Flavoured Soda',
  'Soft Drinks',
  'Drinks',
  'Iced Coffee',
  'Frappes',
  'Smoothies',
  'Hot Speciality',
  'Chill Pill Matcha',
  'Liquid Nitrogen Ice Cream',
  'Chill Pill Nitro Special',
  'Boba Tea',
  'Mocktails',
  'Margarita & Lemonade',
  'Chiller',
  'Chill Pill Special Shakes',
];

export const MenuItemFormModal: React.FC<MenuItemFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuItem['category']>('Deals');
  const [price, setPrice] = useState(550);
  const [isPopular, setIsPopular] = useState(false);
  const [image, setImage] = useState('');
  const [calories, setCalories] = useState(640);
  const [prepTime, setPrepTime] = useState('12-15 min');
  const [spiceLevel, setSpiceLevel] = useState<MenuItem['spiceLevel']>('Medium');
  const [tag, setTag] = useState("Chef's Special");
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name || '');
      setCategory(initialItem.category || 'Deals');
      setPrice(initialItem.price || 550);
      setIsPopular(Boolean(initialItem.isPopular));
      setImage(initialItem.image || '');
      setCalories(initialItem.calories || 600);
      setPrepTime(initialItem.prepTime || '12-15 min');
      setSpiceLevel(initialItem.spiceLevel || 'Medium');
      setTag(initialItem.tag || "Chef's Special");
      setDescription(initialItem.description || '');
    } else {
      setName('');
      setCategory('Deals');
      setPrice(550);
      setIsPopular(false);
      setImage('');
      setCalories(600);
      setPrepTime('12-15 min');
      setSpiceLevel('Medium');
      setTag("Chef's Special");
      setDescription('');
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      category,
      price: Number(price),
      originalPrice: Number(price),
      isPopular,
      image: image.trim() || undefined,
      calories: Number(calories) || 0,
      prepTime: prepTime.trim() || '10-15 min',
      spiceLevel,
      tag: tag.trim() || undefined,
      description: description.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] overflow-y-auto border border-neutral-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#D81A07] flex items-center justify-center border border-red-100">
              <UtensilsCrossed className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <h3 className="font-black text-base text-neutral-900 tracking-tight">
                {initialItem ? 'Edit Dish Details' : 'Add New Menu Item'}
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium">
                Changes apply immediately to your live menu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Dish Title / Name */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              Dish Title / Name <span className="text-[#D81A07]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Signature Crispy Tenders (5 Pcs)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D81A07] focus:ring-2 focus:ring-[#D81A07]/20 text-sm outline-none bg-white text-neutral-900"
            />
          </div>

          {/* Dish Image URL with live preview thumbnail */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              Image URL / Asset Path
            </label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                {image.trim() ? (
                  <img
                    src={normalizeImageUrl(image)}
                    alt="Preview"
                    onError={handleImageError}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-neutral-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://... image link or asset path"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D81A07] focus:ring-2 focus:ring-[#D81A07]/20 text-xs sm:text-sm outline-none bg-white text-neutral-900"
                />
                <span className="text-[10px] text-neutral-400 block mt-0.5">
                  Paste a valid image web URL or asset image URL
                </span>
              </div>
            </div>
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MenuItem['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D81A07] focus:ring-2 focus:ring-[#D81A07]/20 text-xs sm:text-sm outline-none bg-white text-neutral-900"
              >
                {MENU_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Selling Price (Rs.) <span className="text-[#D81A07]">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D81A07] focus:ring-2 focus:ring-[#D81A07]/20 text-sm outline-none bg-white text-neutral-900 font-semibold"
              />
            </div>
          </div>

          {/* Promotional Tag */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              Badge / Promotional Tag (Optional)
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. Chef's Special, Signature, Spicy"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D81A07] focus:ring-2 focus:ring-[#D81A07]/20 text-sm outline-none bg-white text-neutral-900"
            />
          </div>

          {/* Dynamic Popular Badge Toggle */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFC700] text-black flex items-center justify-center font-bold shadow-2xs shrink-0">
                <Sparkles className="w-4 h-4 fill-black" />
              </div>
              <div>
                <h4 className="text-xs font-black text-neutral-900">Popular Dish Badge</h4>
                <p className="text-[11px] text-neutral-600 font-medium">
                  Display the prominent 'Popular' badge on this product across menu cards
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFC700]"></div>
            </label>
          </div>

          {/* Prep Time & Calories */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Prep Time
              </label>
              <input
                type="text"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="e.g. 10-15 min"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D81A07] focus:ring-2 focus:ring-[#D81A07]/20 text-sm outline-none bg-white text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Calories (kcal)
              </label>
              <input
                type="number"
                min={0}
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D81A07] focus:ring-2 focus:ring-[#D81A07]/20 text-sm outline-none bg-white text-neutral-900"
              />
            </div>
          </div>

          {/* Spice Level */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              Spice Level
            </label>
            <select
              value={spiceLevel}
              onChange={(e) => setSpiceLevel(e.target.value as MenuItem['spiceLevel'])}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D81A07] focus:ring-2 focus:ring-[#D81A07]/20 text-sm outline-none bg-white text-neutral-900"
            >
              <option value="None">None</option>
              <option value="Mild">Mild</option>
              <option value="Medium">Medium</option>
              <option value="Hot">Hot</option>
              <option value="Fiery Hot">Fiery Hot</option>
            </select>
          </div>

          {/* Description & Ingredients */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              Description & Ingredients
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Freshly prepared crispy chicken tenders, secret marinade, hot signature dipping sauce..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D81A07] focus:ring-2 focus:ring-[#D81A07]/20 text-sm outline-none resize-none bg-white text-neutral-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 text-neutral-700 font-bold text-xs hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-[#D81A07] hover:bg-[#b81505] text-white font-bold text-xs transition-colors shadow-md shadow-[#D81A07]/25 cursor-pointer"
            >
              {initialItem ? 'Save Changes' : 'Add to Menu'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
