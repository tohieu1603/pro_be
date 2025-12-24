import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { Product } from "./product.entity";
import { Region } from "./region.entity";

/**
 * Product-Region relationship for region-specific pricing and availability
 * Allows same product to have different prices/stock in different regions
 */
@Entity("product_regions")
@Unique(["productId", "regionId"])
@Index(["productId", "regionId"])
@Index(["regionId", "isAvailable"])
export class ProductRegion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product?: Product;

  @Column({ name: "region_id", type: "uuid" })
  regionId!: string;

  @ManyToOne(() => Region, { onDelete: "CASCADE" })
  @JoinColumn({ name: "region_id" })
  region?: Region;

  // Region-specific pricing (null = use base price)
  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  price?: number;

  @Column({ name: "compare_at_price", type: "decimal", precision: 15, scale: 2, nullable: true })
  compareAtPrice?: number;

  // Region-specific stock
  @Column({ name: "stock_quantity", default: 0 })
  stockQuantity!: number;

  @Column({ name: "low_stock_threshold", default: 5 })
  lowStockThreshold!: number;

  // Availability
  @Column({ name: "is_available", default: true })
  isAvailable!: boolean;

  // Region-specific promotion text
  @Column({ name: "promotion_text", length: 500, nullable: true })
  promotionText?: string;

  // Shipping info
  @Column({ name: "shipping_note", length: 500, nullable: true })
  shippingNote?: string;

  @Column({ name: "delivery_days", nullable: true })
  deliveryDays?: number;

  // Timestamps
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
