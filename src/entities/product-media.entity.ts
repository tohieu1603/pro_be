import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Product } from "./product.entity";
import { ProductVariant } from "./product-variant.entity";

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  VIEW_360 = "360",
  AR_MODEL = "ar_model",
}

@Entity("product_media")
export class ProductMedia {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.media, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "product_id" })
  product?: Product;

  @Column({ name: "variant_id", type: "uuid", nullable: true })
  variantId?: string;

  @ManyToOne(() => ProductVariant, (variant) => variant.media, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "variant_id" })
  variant?: ProductVariant;

  @Column({ type: "varchar", length: 20 })
  type!: MediaType;

  @Column({ length: 1000 })
  url!: string;

  @Column({ name: "thumbnail_url", length: 1000, nullable: true })
  thumbnailUrl?: string;

  @Column({ name: "alt_text", length: 500, nullable: true })
  altText?: string;

  @Column({ length: 200, nullable: true })
  title?: string;

  @Column({ name: "video_provider", length: 50, nullable: true })
  videoProvider?: string;

  @Column({ name: "video_id", length: 100, nullable: true })
  videoId?: string;

  @Column({ nullable: true })
  duration?: number;

  @Column({ name: "display_order", default: 0 })
  displayOrder!: number;

  @Column({ name: "is_primary", default: false })
  isPrimary!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
