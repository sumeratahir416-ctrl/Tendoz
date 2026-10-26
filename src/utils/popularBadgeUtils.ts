import { MenuItem } from '../types';

export interface SubcategoryGroup {
  title: string;
  items: MenuItem[];
}

/**
 * Breaks burger items into three official subcategories:
 * 1. Grilled Beef Burger
 * 2. Grilled Chicken Burger
 * 3. Fried Burgers
 */
export function getBurgerSubcategories(catItems: MenuItem[]): SubcategoryGroup[] {
  const remaining = [...catItems];

  const takeByKeywords = (keywords: string[]): MenuItem[] => {
    const matched: MenuItem[] = [];
    for (let i = remaining.length - 1; i >= 0; i--) {
      const item = remaining[i];
      const text = `${item.name} ${item.description || ''}`.toLowerCase();
      if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
        matched.unshift(item);
        remaining.splice(i, 1);
      }
    }
    return matched;
  };

  // 1. Grilled Beef Burger
  const grilledBeef = takeByKeywords([
    'ten king beef',
    'teen king beef',
    'firestar beef',
    'fire star beef',
    'wildfire beef',
    'smoky beef',
    'smokey beef',
  ]);

  // 2. Grilled Chicken Burger
  const grilledChicken = takeByKeywords([
    'ten king chicken',
    'firestar chicken',
    'fiesta chicken',
  ]);

  // 3. Fried Burgers (Zingo, Zingo Tower, Zingo Tringo, Chicken Fillet, Crispy Fillet, etc.)
  const friedBurgers = remaining;

  const subcats: SubcategoryGroup[] = [];
  if (grilledBeef.length > 0) {
    subcats.push({ title: 'Grilled Beef Burger', items: grilledBeef });
  }
  if (grilledChicken.length > 0) {
    subcats.push({ title: 'Grilled Chicken Burger', items: grilledChicken });
  }
  if (friedBurgers.length > 0) {
    subcats.push({ title: 'Fried Burgers', items: friedBurgers });
  }

  return subcats;
}

/**
 * Breaks pizza items into four official subcategories:
 * 1. Regular Pizza
 * 2. Supreme Pizza
 * 3. Signature Pizza
 * 4. Special Pizza
 */
export function getPizzaSubcategories(catItems: MenuItem[]): SubcategoryGroup[] {
  const remaining = [...catItems];

  const takeByKeywords = (keywords: string[]): MenuItem[] => {
    const matched: MenuItem[] = [];
    for (let i = remaining.length - 1; i >= 0; i--) {
      const item = remaining[i];
      const text = `${item.name} ${item.description || ''}`.toLowerCase();
      if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
        matched.unshift(item);
        remaining.splice(i, 1);
      }
    }
    return matched;
  };

  // 1. Regular Pizza
  const regularPizza = takeByKeywords([
    'tikka',
    'fajita',
    'veggie lover',
    'hot and spicy',
    'hot & spicy',
    'cheese lover',
  ]);

  // 2. Supreme Pizza
  const supremePizza = takeByKeywords(['supreme']);

  // 3. Signature Pizza
  const signaturePizza = takeByKeywords(['signature']);

  // 4. Special Pizza (Pocket Pizza, Crown, etc.)
  const specialPizza = remaining;

  const subcats: SubcategoryGroup[] = [];
  if (regularPizza.length > 0) {
    subcats.push({ title: 'Regular Pizza', items: regularPizza });
  }
  if (supremePizza.length > 0) {
    subcats.push({ title: 'Supreme Pizza', items: supremePizza });
  }
  if (signaturePizza.length > 0) {
    subcats.push({ title: 'Signature Pizza', items: signaturePizza });
  }
  if (specialPizza.length > 0) {
    subcats.push({ title: 'Special Pizza', items: specialPizza });
  }

  return subcats;
}

/**
 * Resolves the Set of MenuItem IDs that display the Popular badge:
 * 1. Respects any item explicitly marked as popular by admin or database (item.isPopular === true).
 * 2. Enforces that EVERY subcategory (Grilled Beef, Grilled Chicken, Fried Burgers,
 *    Regular Pizza, Supreme Pizza, Signature Pizza, Special Pizza) has a Popular badge
 *    assigned to AT LEAST ONE product. If a subcategory has none, automatically assigns it to one.
 * 3. Enforces that all other categories have at least one (and up to two) Popular badges.
 */
export function resolvePopularBadgeItemIds(items: MenuItem[]): Set<string> {
  const ids = new Set<string>();

  // 1. All explicitly flagged popular items from database / admin assignments
  items.forEach((item) => {
    if (item.isPopular) {
      ids.add(item.id);
    }
  });

  // 2. Subcategory check for Burgers
  const burgerItems = items.filter(
    (i) => i.category === 'Burgers' || i.category === 'Burger'
  );
  if (burgerItems.length > 0) {
    const burgerSubcats = getBurgerSubcategories(burgerItems);
    burgerSubcats.forEach((subcat) => {
      const hasPopular = subcat.items.some((i) => ids.has(i.id));
      if (!hasPopular && subcat.items.length > 0) {
        // Automatically assign popular badge to first item in this subcategory
        ids.add(subcat.items[0].id);
      }
    });
  }

  // 3. Subcategory check for Pizzas
  const pizzaItems = items.filter(
    (i) => i.category === 'Pizzas' || i.category === 'Pizza'
  );
  if (pizzaItems.length > 0) {
    const pizzaSubcats = getPizzaSubcategories(pizzaItems);
    pizzaSubcats.forEach((subcat) => {
      const hasPopular = subcat.items.some((i) => ids.has(i.id));
      if (!hasPopular && subcat.items.length > 0) {
        // Prefer pocket pizza if in Special Pizza, or tikka in Regular Pizza
        const pocket = subcat.items.find((i) =>
          i.id === 'pocket-pizza' || i.name.toLowerCase().includes('pocket pizza')
        );
        const tikka = subcat.items.find((i) =>
          i.id === 'chicken-tikka-pizza' || i.name.toLowerCase().includes('tikka')
        );
        const chosen = pocket || tikka || subcat.items[0];
        ids.add(chosen.id);
      }
    });
  }

  // 4. Standalone categories (Deals, Appetizers, Fried Chicken, Wraps, Injected Broast,
  //    Pastas, Drinks, Chill Pill categories, etc.)
  const categoryMap = new Map<string, MenuItem[]>();
  items.forEach((item) => {
    let cat = (item.category || 'Other').trim();
    if (cat === 'Pizza') cat = 'Pizzas';
    if (cat === 'Burger') cat = 'Burgers';
    // Skip Burgers and Pizzas as they have already been handled by subcategories
    if (cat === 'Burgers' || cat === 'Pizzas') return;

    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, []);
    }
    categoryMap.get(cat)!.push(item);
  });

  categoryMap.forEach((catItems) => {
    const existingInCat = catItems.filter((i) => ids.has(i.id));

    // Ensure every subcategory / category has at least one Popular badge
    if (existingInCat.length === 0 && catItems.length > 0) {
      ids.add(catItems[0].id);
      // If category has multiple items, also add a 2nd to satisfy strict 2 products per category rule
      if (catItems.length >= 2) {
        ids.add(catItems[1].id);
      }
    } else if (existingInCat.length === 1 && catItems.length >= 2) {
      // If only 1 was marked, add 1 more to keep standard 2 per category
      const second = catItems.find((i) => !ids.has(i.id));
      if (second) {
        ids.add(second.id);
      }
    }
  });

  return ids;
}
