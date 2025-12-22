import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Product } from "./product.entity";
import { ProductMedia } from "./product-media.entity";
import { ProductVariantOption } from "./product-variant-option.entity";
import { Inventory } from "./inventory.entity";

export enum VariantStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  OUT_OF_STOCK = "out_of_stock",
}

@Entity("product_variants")
export class ProductVariant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "product_id" })
  product?: Product;

  @Column({ length: 100, unique: true })
  sku!: string;

  @Column({ length: 500, nullable: true })
  name?: string;

  @Column({ type: "decimal", precision: 15, scale: 2 })
  price!: number;

  @Column({
    name: "compare_at_price",
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
  })
  compareAtPrice?: number;

  @Column({
    name: "cost_price",
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
  })
  costPrice?: number;

  @Column({ name: "stock_quantity", default: 0 })
  stockQuantity!: number;

  @Column({ name: "low_stock_threshold", default: 5 })
  lowStockThreshold!: number;

  @Column({ name: "track_inventory", default: true })
  trackInventory!: boolean;

  @Column({ name: "allow_backorder", default: false })
  allowBackorder!: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  weight?: number;

  @Column({ name: "weight_unit", length: 10, default: "kg" })
  weightUnit!: string;

  @Column({ length: 100, nullable: true })
  barcode?: string;

  @Column({ name: "is_default", default: false })
  isDefault!: boolean;

  @Column({
    type: "varchar",
    length: 20,
    default: VariantStatus.ACTIVE,
  })
  status!: VariantStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => ProductMedia, (media) => media.variant)
  media?: ProductMedia[];

  @OneToMany(() => ProductVariantOption, (option) => option.variant)
  options?: ProductVariantOption[];

  @OneToMany(() => Inventory, (inventory) => inventory.variant)
  inventories?: Inventory[];
}
