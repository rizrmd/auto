/**
 * Slug Generator Utility
 *
 * Generates SEO-friendly URL slugs from strings.
 */

import { SLUG_CONFIG } from '../config/constants';

/**
 * Generates a URL-safe slug from a string
 *
 * @param text - The text to convert to a slug
 * @param options - Optional configuration
 * @returns URL-safe slug
 *
 * @example
 * generateSlug('Avanza 2020 Hitam #A01') // 'avanza-2020-hitam-a01'
 * generateSlug('Toyota Fortuner VRZ 4x4') // 'toyota-fortuner-vrz-4x4'
 */
export function generateSlug(
  text: string,
  options: {
    separator?: string;
    lowercase?: boolean;
    maxLength?: number;
  } = {}
): string {
  const {
    separator = SLUG_CONFIG.SEPARATOR,
    lowercase = SLUG_CONFIG.LOWERCASE,
    maxLength = SLUG_CONFIG.MAX_LENGTH,
  } = options;

  let slug = text
    // Remove leading/trailing whitespace
    .trim()
    // Replace ampersands with 'and'
    .replace(/&/g, '-and-')
    // Remove all non-word characters except hyphens and spaces
    .replace(/[^\w\s-]/g, '')
    // Replace multiple spaces or hyphens with single separator
    .replace(/[\s-]+/g, separator)
    // Remove leading/trailing separators
    .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');

  // Convert to lowercase if specified
  if (lowercase) {
    slug = slug.toLowerCase();
  }

  // Truncate to max length
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Remove trailing separator if present after truncation
    slug = slug.replace(new RegExp(`${separator}+$`), '');
  }

  return slug;
}

/**
 * Generates a unique slug by appending a number if the slug already exists
 *
 * @param baseSlug - The base slug to make unique
 * @param checkExists - Async function that checks if slug exists
 * @returns Unique slug
 *
 * @example
 * await generateUniqueSlug('avanza-2020', async (slug) => {
 *   return await db.car.findUnique({ where: { slug } }) !== null;
 * });
 * // Returns 'avanza-2020-2' if 'avanza-2020' exists
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug;
  let counter = 2;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Safety limit to prevent infinite loops
    if (counter > 1000) {
      // Append timestamp as fallback
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

/**
 * Generates a car slug from car details
 *
 * @param brand - Car brand
 * @param model - Car model
 * @param year - Car year
 * @param color - Car color
 * @param displayCode - Car display code
 * @returns Car slug
 *
 * @example
 * generateCarSlug('Toyota', 'Avanza', 2020, 'Hitam', 'A01')
 * // Returns 'toyota-avanza-2020-hitam-a01'
 */
export function generateCarSlug(
  brand: string,
  model: string,
  year: number,
  color: string,
  displayCode: string
): string {
  const parts = [brand, model, year.toString(), color, displayCode];
  const combined = parts.join(' ');
  return generateSlug(combined);
}

/**
 * Sanitizes a display code to ensure it's URL-safe
 *
 * @param displayCode - The display code to sanitize
 * @returns Sanitized display code
 *
 * @example
 * sanitizeDisplayCode('#A01') // 'a01'
 * sanitizeDisplayCode('STK-001') // 'stk-001'
 */
export function sanitizeDisplayCode(displayCode: string): string {
  return generateSlug(displayCode);
}

/**
 * Extracts text from a slug
 *
 * @param slug - The slug to convert
 * @param capitalize - Whether to capitalize words
 * @returns Human-readable text
 *
 * @example
 * slugToText('toyota-avanza-2020') // 'toyota avanza 2020'
 * slugToText('toyota-avanza-2020', true) // 'Toyota Avanza 2020'
 */
export function slugToText(slug: string, capitalize = false): string {
  let text = slug.replace(/-/g, ' ');

  if (capitalize) {
    text = text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  return text;
}
