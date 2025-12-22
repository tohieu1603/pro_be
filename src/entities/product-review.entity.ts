import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Product } from "./product.entity";
import { ProductVariant } from "./product-variant.entity";
import { ReviewReply } from "./review-reply.entity";

@Entity("product_reviews")
export class ProductReview {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.reviews, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "product_id" })
  product?: Product;

  @Column({ name: "variant_id", type: "uuid", nullable: true })
  variantId?: string;

  @ManyToOne(() => ProductVariant, { onDelete: "SET NULL" })
  @JoinColumn({ name: "variant_id" })
  variant?: ProductVariant;

  @Column({ name: "customer_id", type: "uuid" })
  customerId!: string;

  @Column({ name: "order_id", type: "uuid", nullable: true })
  orderId?: string;

  @Column()
  rating!: number;

  @Column({ length: 200, nullable: true })
  title?: string;

  @Column({ type: "text", nullable: true })
  content?: string;

  @Column({ type: "text", array: true, nullable: true })
  pros?: string[];

  @Column({ type: "text", array: true, nullable: true })
  cons?: string[];

  @Column({ type: "text", array: true, nullable: true })
  images?: string[];

  @Column({ type: "text", array: true, nullable: true })
  videos?: string[];

  @Column({ name: "is_verified_purchase", default: false })
  isVerifiedPurchase!: boolean;

  @Column({ name: "is_approved", default: false })
  isApproved!: boolean;

  @Column({ name: "helpful_count", default: 0 })
  helpfulCount!: number;

  @Column({ name: "not_helpful_count", default: 0 })
  notHelpfulCount!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => ReviewReply, (reply) => reply.review)
  replies?: ReviewReply[];
}
