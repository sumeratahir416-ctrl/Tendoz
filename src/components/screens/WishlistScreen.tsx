import React from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { MenuItem } from '../../types';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';

interface WishlistScreenProps {
  wishlistItems: MenuItem[];
  onToggleWishlist: (itemId: string) => void;
  onSelectItem: (item: MenuItem) => void;
  onOrderNow: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem) => void;
  onExplore: () => void;
}

export const WishlistScreen: React.FC<WishlistScreenProps> = ({
  wishlistItems,
  onToggleWishlist,
  onSelectItem,
  onOrderNow,
  onAddToCart,
  onExplore,
}) => {
  return (
    <div className="w-full bg-neutral-50/60 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D81A07] flex items-center justify-center">
              <Heart className="w-5 h-5 fill-[#D81A07]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Favorite Cravings
              </h1>
              <span className="text-xs text-neutral-500">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'dish' : 'dishes'} saved for your next order
              </span>
            </div>
          </div>

          <button
            onClick={onExplore}
            className="text-xs sm:text-sm font-semibold text-[#D81A07] hover:text-[#b81505] cursor-pointer"
          >
            ← Explore Menu
          </button>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white rounded-3xl border border-neutral-200/80 shadow-xs">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-neutral-400">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-neutral-900">No favorite dishes yet</h3>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto mt-1 mb-6">
              Tap the heart icon on any tenders, smash burgers, or sides to bookmark your cravings.
            </p>
            <button
              onClick={onExplore}
              className="py-3 px-6 bg-[#D81A07] hover:bg-[#b81505] text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-md shadow-[#D81A07]/25"
            >
              Browse Tendoz Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div>
                  <div
                    onClick={() => onSelectItem(item)}
                    className="aspect-4/3 rounded-2xl overflow-hidden bg-neutral-100 mb-3 cursor-pointer"
                  >
                    <img
                      src={normalizeImageUrl(item.image)}
                      alt={item.name}
                      onError={handleImageError}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <h3
                    onClick={() => onSelectItem(item)}
                    className="font-bold text-sm text-neutral-900 truncate cursor-pointer hover:text-[#D81A07] transition-colors"
                  >
                    {item.name}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 truncate">{item.category}</p>
                  <div className="text-sm font-black text-neutral-900 mt-2">
                    Rs. {item.price}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-neutral-100 mt-3">
                  <button
                    onClick={() => onOrderNow(item)}
                    className="flex-1 py-2 px-3 bg-[#D81A07] hover:bg-[#b81505] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    Order
                  </button>
                  <button
                    onClick={() => onAddToCart(item)}
                    className="p-2 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-neutral-700 transition-colors cursor-pointer"
                    title="Add to Bag"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onToggleWishlist(item.id)}
                    className="p-2 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
