/**
 * Common Philippine product prices (Estimated for 2025)
 */

export interface ProductPrice {
  name: string;
  price: number;
  category: string;
  unit?: string;
}

export const PRODUCT_PRICES: ProductPrice[] = [
  // Staples
  { name: 'Rice', price: 50.00, category: 'groceries', unit: 'kg' },
  { name: 'Rice (1kg)', price: 50.00, category: 'groceries' },
  { name: 'Egg', price: 9.00, category: 'food', unit: 'pc' },
  { name: 'Egg (1pc)', price: 9.00, category: 'food' },
  { name: 'Eggs (Dozen)', price: 108.00, category: 'food' },
  { name: 'Eggs (Tray of 30)', price: 250.00, category: 'food' },
  
  // Meat & Poultry
  { name: 'Chicken', price: 200.00, category: 'groceries', unit: 'kg' },
  { name: 'Chicken Fillet', price: 247.00, category: 'groceries', unit: 'kg' },
  { name: 'Pork Liempo', price: 380.00, category: 'groceries', unit: 'kg' },
  { name: 'Pork Kasim', price: 250.00, category: 'groceries', unit: 'kg' },
  { name: 'Beef Round', price: 420.00, category: 'groceries', unit: 'kg' },
  { name: 'Ground Pork', price: 320.00, category: 'groceries', unit: 'kg' },
  { name: 'Ground Beef', price: 400.00, category: 'groceries', unit: 'kg' },

  // Dairy & Bakery
  { name: 'Milk (1L)', price: 102.00, category: 'groceries' },
  { name: 'Milk', price: 102.00, category: 'groceries', unit: 'L' },
  { name: 'Loaf Bread', price: 85.00, category: 'food' },
  { name: 'Gardenia Bread', price: 85.00, category: 'food' },
  { name: 'Pandesal (10pcs)', price: 50.00, category: 'food' },
  
  // Canned Goods & Instant
  { name: 'Lucky Me Noodles', price: 12.00, category: 'food' },
  { name: 'Instant Noodles', price: 12.00, category: 'food' },
  { name: 'Sardines', price: 22.00, category: 'food' },
  { name: 'Corned Beef', price: 35.00, category: 'food' },
  { name: '3-in-1 Coffee', price: 10.00, category: 'food' },
  
  // Produce
  { name: 'Onion', price: 150.00, category: 'groceries', unit: 'kg' },
  { name: 'Garlic', price: 120.00, category: 'groceries', unit: 'kg' },
  { name: 'Tomato', price: 80.00, category: 'groceries', unit: 'kg' },
  { name: 'Potato', price: 100.00, category: 'groceries', unit: 'kg' },
  { name: 'Banana (1kg)', price: 75.00, category: 'food' },
];

/**
 * Find a price suggestion for a given input string.
 * Checks custom prices first, then fallback to defaults.
 */
export function getPriceSuggestion(
  input: string, 
  customPrices: Record<string, number> = {}
): { name: string; price: number } | null {
  if (!input || input.length < 2) return null;
  
  const normalizedInput = input.toLowerCase().trim();
  
  // Check custom prices first (Exact match)
  if (customPrices[normalizedInput]) {
    return { name: input.trim(), price: customPrices[normalizedInput] };
  }

  // Check custom prices (Starts with)
  const customMatch = Object.keys(customPrices).find(k => k.startsWith(normalizedInput));
  if (customMatch) {
    return { name: customMatch, price: customPrices[customMatch] };
  }
  
  // Fallback to default prices
  // Try exact match first
  const exactMatch = PRODUCT_PRICES.find(p => p.name.toLowerCase() === normalizedInput);
  if (exactMatch) return { name: exactMatch.name, price: exactMatch.price };
  
  // Try starts with
  const startsWithMatch = PRODUCT_PRICES.find(p => p.name.toLowerCase().startsWith(normalizedInput));
  if (startsWithMatch) return { name: startsWithMatch.name, price: startsWithMatch.price };
  
  // Try includes (only if input is long enough to avoid too many false positives)
  if (normalizedInput.length >= 3) {
    const includesMatch = PRODUCT_PRICES.find(p => p.name.toLowerCase().includes(normalizedInput));
    if (includesMatch) return { name: includesMatch.name, price: includesMatch.price };
  }
  
  return null;
}
