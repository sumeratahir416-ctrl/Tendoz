import React from 'react';
import { MenuItem } from '../../types';
import { ProductDetailModal } from './ProductDetailModal';

interface DetailsScreenProps {
  item: MenuItem;
  allItems?: MenuItem[];
  wishlistIds?: string[];
  onToggleWishlist?: (itemId: string) => void;
  onBack?: () => void;
  onSelectItem?: (item: MenuItem) => void;
  onOrderNow?: (item: MenuItem) => void;
  onAddToCart: (
    item: MenuItem,
    quantity?: number,
    options?: { addOns?: string[]; notes?: string; total?: number }
  ) => void;
}

/**
 * Clean centered popup/modal replacing the legacy Product Detail Page (PDP).
 */
export const DetailsScreen: React.FC<DetailsScreenProps> = ({
  item,
  onBack,
  onAddToCart,
}) => {
  return (
    <ProductDetailModal
      isOpen={true}
      item={item}
      onClose={onBack || (() => {})}
      onAddToCart={(dish, qty, opts) => onAddToCart(dish, qty, opts)}
    />
  );
};

export default DetailsScreen;
