import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Brand } from "./brand.entity";
import { Category } from "./category.entity";
import { ProductVariant } from "./product-variant.entity";
import { ProductMedia } from "./product-media.entity";
import { ProductAttribute } from "./product-attribute.entity";
import { ProductReview } from "./product-review.entity";
import { ProductQuestion } from "./product-question.entity";
import { Tag } from "./tag.entity";

export enum ProductStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  INACTIVE = "inactive",
  DISCONTINUED = "discontinued",
}

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 50, unique: true })
  spk!: string;

  @Column({ length: 500 })
  name!: string;

  @Column({ length: 500, unique: true })
  slug!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "short_description", length: 1000, nullable: true })
  shortDescription?: string;

  @Column({ name: "brand_id", type: "uuid", nullable: true })
  brandId?: string;

  @ManyToOne(() => Brand, (brand) => brand.products, { onDelete: "SET NULL" })
  @JoinColumn({ name: "brand_id" })
  brand?: Brand;

  @Column({ name: "category_id", type: "uuid", nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "category_id" })
  category?: Category;

  @Column({
    name: "base_price",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  basePrice!: number;

  @Column({ name: "meta_title", length: 200, nullable: true })
  metaTitle?: string;

  @Column({ name: "meta_description", length: 500, nullable: true })
  metaDescription?: string;

  @Column({ name: "meta_keywords", type: "text", array: true, nullable: true })
  metaKeywords?: string[];

  @Column({
    type: "varchar",
    length: 20,
    default: ProductStatus.DRAFT,
  })
  status!: ProductStatus;

  @Column({ name: "is_featured", default: false })
  isFeatured!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @Column({ name: "published_at", type: "timestamptz", nullable: true })
  publishedAt?: Date;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants?: ProductVariant[];

  @OneToMany(() => ProductMedia, (media) => media.product)
  media?: ProductMedia[];

  @OneToMany(() => ProductAttribute, (attr) => attr.product)
  attributes?: ProductAttribute[];

  @OneToMany(() => ProductReview, (review) => review.product)
  reviews?: ProductReview[];

  @OneToMany(() => ProductQuestion, (question) => question.product)
  questions?: ProductQuestion[];

  @ManyToMany(() => Tag, (tag) => tag.products)
  @JoinTable({
    name: "product_tags",
    joinColumn: { name: "product_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tag_id", referencedColumnName: "id" },
  })
  tags?: Tag[];
}
