/**
 * Multi-tenant Region Utilities
 * Common helper functions for region/subdomain handling
 */

import { Request } from "express";

/**
 * Extract subdomain from hostname
 * @example "hanoi.dieuhoaxyz.vn" -> "hanoi"
 * @example "www.dieuhoaxyz.vn" -> null (www is not a region)
 * @example "dieuhoaxyz.vn" -> null (no subdomain)
 */
export function extractSubdomain(hostname: string): string | null {
  if (!hostname) return null;

  // Remove port if exists
  const host = hostname.split(":")[0];

  // Split by dots
  const parts = host.split(".");

  // Need at least 3 parts for subdomain (sub.domain.tld)
  if (parts.length < 3) return null;

  const subdomain = parts[0].toLowerCase();

  // Ignore common non-region subdomains
  const ignoredSubdomains = ["www", "admin", "api", "app", "mail", "ftp", "cdn", "static"];
  if (ignoredSubdomains.includes(subdomain)) return null;

  return subdomain;
}

/**
 * Extract subdomain from Express request
 */
export function getSubdomainFromRequest(req: Request): string | null {
  // Check header first (for proxy setups)
  const forwardedHost = req.get("x-forwarded-host") || req.get("host") || "";
  return extractSubdomain(forwardedHost);
}

/**
 * Check if request is from admin panel
 */
export function isAdminRequest(req: Request): boolean {
  const host = req.get("x-forwarded-host") || req.get("host") || "";
  const subdomain = extractSubdomain(host);
  return subdomain === "admin" || host.includes("localhost") || host.includes("127.0.0.1");
}

/**
 * Build full URL for a region
 */
export function buildRegionUrl(subdomain: string, baseDomain: string, path = ""): string {
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${subdomain}.${baseDomain}${path}`;
}

/**
 * Normalize region slug (lowercase, alphanumeric and hyphens only)
 */
export function normalizeRegionSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Vietnamese province slugs mapping
 */
export const VIETNAM_PROVINCES: Record<string, string> = {
  "ha-noi": "Hà Nội",
  "ho-chi-minh": "TP. Hồ Chí Minh",
  "da-nang": "Đà Nẵng",
  "hai-phong": "Hải Phòng",
  "can-tho": "Cần Thơ",
  "an-giang": "An Giang",
  "ba-ria-vung-tau": "Bà Rịa - Vũng Tàu",
  "bac-giang": "Bắc Giang",
  "bac-kan": "Bắc Kạn",
  "bac-lieu": "Bạc Liêu",
  "bac-ninh": "Bắc Ninh",
  "ben-tre": "Bến Tre",
  "binh-dinh": "Bình Định",
  "binh-duong": "Bình Dương",
  "binh-phuoc": "Bình Phước",
  "binh-thuan": "Bình Thuận",
  "ca-mau": "Cà Mau",
  "cao-bang": "Cao Bằng",
  "dak-lak": "Đắk Lắk",
  "dak-nong": "Đắk Nông",
  "dien-bien": "Điện Biên",
  "dong-nai": "Đồng Nai",
  "dong-thap": "Đồng Tháp",
  "gia-lai": "Gia Lai",
  "ha-giang": "Hà Giang",
  "ha-nam": "Hà Nam",
  "ha-tinh": "Hà Tĩnh",
  "hai-duong": "Hải Dương",
  "hau-giang": "Hậu Giang",
  "hoa-binh": "Hòa Bình",
  "hung-yen": "Hưng Yên",
  "khanh-hoa": "Khánh Hòa",
  "kien-giang": "Kiên Giang",
  "kon-tum": "Kon Tum",
  "lai-chau": "Lai Châu",
  "lam-dong": "Lâm Đồng",
  "lang-son": "Lạng Sơn",
  "lao-cai": "Lào Cai",
  "long-an": "Long An",
  "nam-dinh": "Nam Định",
  "nghe-an": "Nghệ An",
  "ninh-binh": "Ninh Bình",
  "ninh-thuan": "Ninh Thuận",
  "phu-tho": "Phú Thọ",
  "phu-yen": "Phú Yên",
  "quang-binh": "Quảng Bình",
  "quang-nam": "Quảng Nam",
  "quang-ngai": "Quảng Ngãi",
  "quang-ninh": "Quảng Ninh",
  "quang-tri": "Quảng Trị",
  "soc-trang": "Sóc Trăng",
  "son-la": "Sơn La",
  "tay-ninh": "Tây Ninh",
  "thai-binh": "Thái Bình",
  "thai-nguyen": "Thái Nguyên",
  "thanh-hoa": "Thanh Hóa",
  "thua-thien-hue": "Thừa Thiên Huế",
  "tien-giang": "Tiền Giang",
  "tra-vinh": "Trà Vinh",
  "tuyen-quang": "Tuyên Quang",
  "vinh-long": "Vĩnh Long",
  "vinh-phuc": "Vĩnh Phúc",
  "yen-bai": "Yên Bái",
};

/**
 * Get province name from slug
 */
export function getProvinceName(slug: string): string | null {
  return VIETNAM_PROVINCES[slug] || null;
}
