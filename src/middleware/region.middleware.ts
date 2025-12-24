/**
 * Region Middleware
 * Extracts region from subdomain and attaches to request
 */

import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { Region } from "../entities";
import { getSubdomainFromRequest, isAdminRequest } from "../utils/multi-tenant";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      region?: Region | null;
      regionId?: string | null;
      isAdminPanel?: boolean;
    }
  }
}

// Cache regions for performance (5 minutes TTL)
let regionsCache: Map<string, Region> = new Map();
let regionsCacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Refresh regions cache
 */
async function refreshRegionsCache(): Promise<void> {
  try {
    const regionRepo = AppDataSource.getRepository(Region);
    const regions = await regionRepo.find({ where: { isActive: true } });

    regionsCache.clear();
    regions.forEach((region) => {
      regionsCache.set(region.subdomain.toLowerCase(), region);
      regionsCache.set(region.slug.toLowerCase(), region);
    });
    regionsCacheTime = Date.now();
  } catch (error) {
    console.error("Error refreshing regions cache:", error);
  }
}

/**
 * Get region from cache or database
 */
async function getRegionBySubdomain(subdomain: string): Promise<Region | null> {
  // Check if cache needs refresh
  if (Date.now() - regionsCacheTime > CACHE_TTL || regionsCache.size === 0) {
    await refreshRegionsCache();
  }

  return regionsCache.get(subdomain.toLowerCase()) || null;
}

/**
 * Clear regions cache (call after region updates)
 */
export function clearRegionsCache(): void {
  regionsCache.clear();
  regionsCacheTime = 0;
}

/**
 * Region detection middleware
 * Attaches region info to request based on subdomain
 */
export function regionMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if admin request
      req.isAdminPanel = isAdminRequest(req);

      // For admin panel, region can be specified via header or query
      if (req.isAdminPanel) {
        const regionId =
          (req.headers["x-region-id"] as string) ||
          (req.query.regionId as string);

        if (regionId) {
          req.regionId = regionId;
          // Optionally load full region
          const regionRepo = AppDataSource.getRepository(Region);
          req.region = await regionRepo.findOne({ where: { id: regionId } });
        }
        return next();
      }

      // For public requests, extract from subdomain
      const subdomain = getSubdomainFromRequest(req);

      if (subdomain) {
        const region = await getRegionBySubdomain(subdomain);
        if (region) {
          req.region = region;
          req.regionId = region.id;
        }
      }

      // If no region found, try to get default region
      if (!req.region) {
        const regionRepo = AppDataSource.getRepository(Region);
        const defaultRegion = await regionRepo.findOne({
          where: { isDefault: true, isActive: true },
        });
        if (defaultRegion) {
          req.region = defaultRegion;
          req.regionId = defaultRegion.id;
        }
      }

      next();
    } catch (error) {
      console.error("Error in region middleware:", error);
      next();
    }
  };
}

/**
 * Require region middleware
 * Returns 400 if no region detected (for region-specific endpoints)
 */
export function requireRegion() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.region && !req.regionId) {
      return res.status(400).json({
        success: false,
        message: "Region not detected. Please access via region subdomain.",
      });
    }
    next();
  };
}
