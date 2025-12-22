import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ProductVariant } from "./product-variant.entity";
import { Warehouse } from "./warehouse.entity";

export enum MovementType {
  IN = "in",
  OUT = "out",
  TRANSFER = "transfer",
  ADJUSTMENT = "adjustment",
}

@Entity("inventory_movements")
export class InventoryMovement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "variant_id", type: "uuid", nullable: true })
  variantId?: string;

  @ManyToOne(() => ProductVariant, { onDelete: "SET NULL" })
  @JoinColumn({ name: "variant_id" })
  variant?: ProductVariant;

  @Column({ name: "warehouse_id", type: "uuid", nullable: true })
  warehouseId?: string;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.movements, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "warehouse_id" })
  warehouse?: Warehouse;

  @Column({ type: "varchar", length: 50 })
  type!: MovementType;

  @Column()
  quantity!: number;

  @Column({ name: "reference_type", length: 50, nullable: true })
  referenceType?: string;

  @Column({ name: "reference_id", type: "uuid", nullable: true })
  referenceId?: string;

  @Column({ type: "text", nullable: true })
  note?: string;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
