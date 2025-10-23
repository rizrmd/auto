/**
 * Price Formatter Utility
 *
 * Formats prices for display in Indonesian Rupiah format.
 */

import { PRICE_FORMAT } from '../config/constants';

/**
 * Formats a number as Indonesian Rupiah currency
 *
 * @param price - The price to format (can be number or bigint)
 * @param options - Optional formatting configuration
 * @returns Formatted price string
 *
 * @example
 * formatPrice(150000000) // 'Rp 150.000.000'
 * formatPrice(150000000, { short: true }) // 'Rp 150 Jt'
 * formatPrice(1500000000, { short: true }) // 'Rp 1,5 M'
 */
export function formatPrice(
  price: number | bigint,
  options: {
    showCurrency?: boolean;
    short?: boolean;
    locale?: string;
  } = {}
): string {
  const {
    showCurrency = true,
    short = false,
    locale = PRICE_FORMAT.LOCALE,
  } = options;

  const numericPrice = typeof price === 'bigint' ? Number(price) : price;

  // Short format (e.g., "150 Jt", "1,5 M")
  if (short) {
    return formatPriceShort(numericPrice, showCurrency);
  }

  // Full format
  const formatted = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericPrice);

  return showCurrency ? `Rp ${formatted}` : formatted;
}

/**
 * Formats price in short form (Jt, M, T)
 */
function formatPriceShort(price: number, showCurrency: boolean): string {
  let value: number;
  let suffix: string;

  if (price >= 1_000_000_000_000) {
    // Triliun
    value = price / 1_000_000_000_000;
    suffix = 'T';
  } else if (price >= 1_000_000_000) {
    // Miliar
    value = price / 1_000_000_000;
    suffix = 'M';
  } else if (price >= 1_000_000) {
    // Juta
    value = price / 1_000_000;
    suffix = 'Jt';
  } else if (price >= 1_000) {
    // Ribu
    value = price / 1_000;
    suffix = 'Rb';
  } else {
    value = price;
    suffix = '';
  }

  // Format with 1 decimal place if not a whole number
  const formattedValue =
    value % 1 === 0 ? value.toFixed(0) : value.toFixed(1).replace('.', ',');

  const result = suffix ? `${formattedValue} ${suffix}` : formattedValue;

  return showCurrency ? `Rp ${result}` : result;
}

/**
 * Parses a formatted price string back to a number
 *
 * @param formattedPrice - The formatted price string
 * @returns Numeric price
 *
 * @example
 * parsePrice('Rp 150.000.000') // 150000000
 * parsePrice('150.000.000') // 150000000
 * parsePrice('Rp 150 Jt') // 150000000
 */
export function parsePrice(formattedPrice: string): number {
  // Remove currency symbol and whitespace
  let cleaned = formattedPrice
    .replace(/Rp/gi, '')
    .replace(/\s/g, '')
    .trim();

  // Handle short format (Jt, M, T)
  const shortMatch = cleaned.match(/^([\d,]+)(Rb|Jt|M|T)$/i);
  if (shortMatch) {
    const value = parseFloat(shortMatch[1].replace(',', '.'));
    const suffix = shortMatch[2].toUpperCase();

    const multipliers: Record<string, number> = {
      RB: 1_000,
      JT: 1_000_000,
      M: 1_000_000_000,
      T: 1_000_000_000_000,
    };

    return value * (multipliers[suffix] || 1);
  }

  // Handle full format - remove dots (thousand separators)
  cleaned = cleaned.replace(/\./g, '');

  // Replace comma with dot for decimal separator
  cleaned = cleaned.replace(',', '.');

  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    throw new Error(`Invalid price format: ${formattedPrice}`);
  }

  return parsed;
}

/**
 * Formats a price range
 *
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @param options - Formatting options
 * @returns Formatted price range
 *
 * @example
 * formatPriceRange(100000000, 200000000) // 'Rp 100.000.000 - Rp 200.000.000'
 * formatPriceRange(100000000, 200000000, { short: true }) // 'Rp 100 Jt - Rp 200 Jt'
 */
export function formatPriceRange(
  minPrice: number | bigint,
  maxPrice: number | bigint,
  options: {
    short?: boolean;
    locale?: string;
  } = {}
): string {
  const min = formatPrice(minPrice, { ...options, showCurrency: true });
  const max = formatPrice(maxPrice, { ...options, showCurrency: true });

  return `${min} - ${max}`;
}

/**
 * Validates if a price is within acceptable range
 *
 * @param price - The price to validate
 * @param min - Minimum allowed price
 * @param max - Maximum allowed price
 * @returns Validation result
 */
export function validatePrice(
  price: number | bigint,
  min: number = 0,
  max: number = 999_999_999_999
): { valid: boolean; error?: string } {
  const numericPrice = typeof price === 'bigint' ? Number(price) : price;

  if (numericPrice < min) {
    return {
      valid: false,
      error: `Price must be at least ${formatPrice(min)}`,
    };
  }

  if (numericPrice > max) {
    return {
      valid: false,
      error: `Price must not exceed ${formatPrice(max)}`,
    };
  }

  return { valid: true };
}

/**
 * Calculates percentage discount
 *
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price
 * @returns Discount percentage
 *
 * @example
 * calculateDiscount(200000000, 150000000) // 25
 */
export function calculateDiscount(
  originalPrice: number | bigint,
  discountedPrice: number | bigint
): number {
  const original = typeof originalPrice === 'bigint' ? Number(originalPrice) : originalPrice;
  const discounted = typeof discountedPrice === 'bigint' ? Number(discountedPrice) : discountedPrice;

  if (original === 0) return 0;

  const discount = ((original - discounted) / original) * 100;
  return Math.round(discount * 10) / 10; // Round to 1 decimal place
}

/**
 * Formats price with discount information
 *
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price
 * @returns Formatted price with discount
 *
 * @example
 * formatPriceWithDiscount(200000000, 150000000)
 * // { current: 'Rp 150.000.000', original: 'Rp 200.000.000', discount: 25 }
 */
export function formatPriceWithDiscount(
  originalPrice: number | bigint,
  discountedPrice: number | bigint
): {
  current: string;
  original: string;
  discount: number;
} {
  return {
    current: formatPrice(discountedPrice),
    original: formatPrice(originalPrice),
    discount: calculateDiscount(originalPrice, discountedPrice),
  };
}
