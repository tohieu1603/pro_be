import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { ProductVariant } from "./product-variant.entity";
import { Warehouse } from "./warehouse.entity";

@Entity("inventory")
@Unique(["variantId", "warehouseId"])
export class Inventory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "variant_id", type: "uuid" })
  variantId!: string;

  @ManyToOne(() => ProductVariant, (variant) => variant.inventories, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "variant_id" })
  variant?: ProductVariant;

  @Column({ name: "warehouse_id", type: "uuid" })
  warehouseId!: string;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.inventories, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "warehouse_id" })
  warehouse?: Warehouse;

  @Column({ default: 0 })
  quantity!: number;

  @Column({ name: "reserved_quantity", default: 0 })
  reservedQuantity!: number;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
