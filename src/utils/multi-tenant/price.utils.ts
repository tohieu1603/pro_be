/**
 * Multi-tenant Price Utilities
 * Common helper functions for region-specific pricing
 */

import { Product } from "../../entities/product.entity";
import { ProductRegion } from "../../entities/product-region.entity";

export interface RegionPriceInfo {
  price: number;
  compareAtPrice?: number;
  discountPercent?: number;
  isRegionSpecific: boolean;
  stockQuantity: number;
  isAvailable: boolean;
  promotionText?: string;
  shippingNote?: string;
  deliveryDays?: number;
}

/**
 * Get effective price for a product in a specific region
 * Falls back to base price if no region-specific price
 */
export function getRegionPrice(
  product: Product,
  productRegion?: ProductRegion | null
): RegionPriceInfo {
  // If region-specific pricing exists and has a price
  if (productRegion && productRegion.price !== null && productRegion.price !== undefined) {
    const price = Number(productRegion.price);
    const compareAtPrice = productRegion.compareAtPrice
      ? Number(productRegion.compareAtPrice)
      : undefined;

    return {
      price,
      compareAtPrice,
      discountPercent: calculateDiscountPercent(price, compareAtPrice),
      isRegionSpecific: true,
      stockQuantity: productRegion.stockQuantity,
      isAvailable: productRegion.isAvailable,
      promotionText: productRegion.promotionText || undefined,
      shippingNote: productRegion.shippingNote || undefined,
      deliveryDays: productRegion.deliveryDays || undefined,
    };
  }

  // Fall back to base product price
  return {
    price: Number(product.basePrice),
    compareAtPrice: undefined,
    discountPercent: undefined,
    isRegionSpecific: false,
    stockQuantity: 0, // No region-specific stock
    isAvailable: true, // Default available
  };
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercent(
  currentPrice: number,
  originalPrice?: number
): number | undefined {
  if (!originalPrice || originalPrice <= currentPrice) return undefined;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Format price to Vietnamese currency
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

/**
 * Format price short (e.g., 15.990.000đ)
 */
export function formatPriceShort(price: number): string {
  return price.toLocaleString("vi-VN") + "đ";
}

/**
 * Parse price from string (handles Vietnamese format)
 */
export function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Remove currency symbols, spaces, dots (thousand separator)
  const cleaned = priceStr
    .replace(/[đ₫VND\s]/gi, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  return parseFloat(cleaned) || 0;
}

/**
 * Check if product is low stock in region
 */
export function isLowStock(productRegion: ProductRegion): boolean {
  return productRegion.stockQuantity <= productRegion.lowStockThreshold;
}

/**
 * Check if product is out of stock in region
 */
export function isOutOfStock(productRegion: ProductRegion): boolean {
  return productRegion.stockQuantity <= 0;
}
