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
import { QuestionAnswer } from "./question-answer.entity";

@Entity("product_questions")
export class ProductQuestion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.questions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "product_id" })
  product?: Product;

  @Column({ name: "customer_name", length: 200 })
  customerName!: string;

  @Column({ name: "customer_email", length: 200, nullable: true })
  customerEmail?: string;

  @Column({ type: "text" })
  question!: string;

  @Column({ name: "is_approved", default: false })
  isApproved!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => QuestionAnswer, (answer) => answer.question)
  answers?: QuestionAnswer[];
}
