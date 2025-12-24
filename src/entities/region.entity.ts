import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from "typeorm";

/**
 * Region entity for multi-tenant support
 * Each region represents a subdomain/branch (e.g., hanoi.dieuhoaxyz.vn)
 */
@Entity("regions")
@Index(["slug"], { unique: true })
@Index(["subdomain"], { unique: true })
export class Region {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Region identification
  @Column({ length: 100 })
  name!: string;

  @Column({ length: 100, unique: true })
  slug!: string;

  @Column({ length: 100, unique: true })
  subdomain!: string;

  // Contact info
  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ name: "phone_secondary", length: 20, nullable: true })
  phoneSecondary?: string;

  @Column({ length: 100, nullable: true })
  email?: string;

  @Column({ type: "text", nullable: true })
  address?: string;

  @Column({ length: 100, nullable: true })
  city?: string;

  @Column({ length: 100, nullable: true })
  province?: string;

  @Column({ length: 20, nullable: true })
  zipcode?: string;

  // Geolocation for maps
  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  longitude?: number;

  // SEO fields
  @Column({ name: "meta_title", length: 200, nullable: true })
  metaTitle?: string;

  @Column({ name: "meta_description", length: 500, nullable: true })
  metaDescription?: string;

  @Column({ name: "og_image", length: 500, nullable: true })
  ogImage?: string;

  // Business settings
  @Column({ name: "working_hours", type: "jsonb", nullable: true })
  workingHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };

  @Column({ name: "shipping_fee", type: "decimal", precision: 15, scale: 2, default: 0 })
  shippingFee!: number;

  @Column({ name: "free_shipping_threshold", type: "decimal", precision: 15, scale: 2, nullable: true })
  freeShippingThreshold?: number;

  // Display settings
  @Column({ name: "display_order", default: 0 })
  displayOrder!: number;

  @Column({ name: "is_default", default: false })
  isDefault!: boolean;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  // Timestamps
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Relations
  @OneToMany("ProductRegion", "region")
  productRegions?: any[];

  @OneToMany("ArticleRegion", "region")
  articleRegions?: any[];
}
