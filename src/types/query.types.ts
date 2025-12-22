export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface ProductQuery extends PaginationQuery {
  categoryId?: string;
  brandId?: string;
  status?: string;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface VariantQuery extends PaginationQuery {
  productId?: string;
  status?: string;
  inStock?: boolean;
}

export interface InventoryQuery extends PaginationQuery {
  warehouseId?: string;
  variantId?: string;
  lowStock?: boolean;
}

export interface ReviewQuery extends PaginationQuery {
  productId?: string;
  rating?: number;
  isApproved?: boolean;
}
