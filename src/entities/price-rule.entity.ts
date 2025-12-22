import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum PriceRuleType {
  PERCENTAGE = "percentage",
  FIXED_AMOUNT = "fixed_amount",
  FIXED_PRICE = "fixed_price",
}

export enum AppliesTo {
  ALL = "all",
  CATEGORY = "category",
  BRAND = "brand",
  PRODUCT = "product",
  VARIANT = "variant",
}

@Entity("price_rules")
export class PriceRule {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ type: "varchar", length: 50 })
  type!: PriceRuleType;

  @Column({ type: "decimal", precision: 15, scale: 2 })
  value!: number;

  @Column({ name: "applies_to", type: "varchar", length: 50, nullable: true })
  appliesTo?: AppliesTo;

  @Column({ name: "target_ids", type: "uuid", array: true, nullable: true })
  targetIds?: string[];

  @Column({ name: "min_quantity", default: 1 })
  minQuantity!: number;

  @Column({
    name: "customer_group_ids",
    type: "uuid",
    array: true,
    nullable: true,
  })
  customerGroupIds?: string[];

  @Column({ name: "starts_at", type: "timestamptz", nullable: true })
  startsAt?: Date;

  @Column({ name: "ends_at", type: "timestamptz", nullable: true })
  endsAt?: Date;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  priority!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
