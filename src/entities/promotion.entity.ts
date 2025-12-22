import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("promotions")
export class Promotion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ length: 50, default: "discount" })
  type!: string; // discount, gift, shipping, installment

  @Column({ type: "text", nullable: true })
  value?: string;

  @Column({ name: "applies_to", length: 50, default: "all" })
  appliesTo!: string; // all, category, brand, product

  @Column({ name: "target_ids", type: "uuid", array: true, nullable: true })
  targetIds?: string[];

  @Column({ name: "starts_at", type: "timestamptz", nullable: true })
  startsAt?: Date;

  @Column({ name: "ends_at", type: "timestamptz", nullable: true })
  endsAt?: Date;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @Column({ name: "display_order", default: 0 })
  displayOrder!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
