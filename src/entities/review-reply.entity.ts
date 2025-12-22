import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ProductReview } from "./product-review.entity";

@Entity("review_replies")
export class ReviewReply {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "review_id", type: "uuid" })
  reviewId!: string;

  @ManyToOne(() => ProductReview, (review) => review.replies, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "review_id" })
  review?: ProductReview;

  @Column({ type: "text" })
  content!: string;

  @Column({ name: "replied_by", type: "uuid", nullable: true })
  repliedBy?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
