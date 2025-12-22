import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Inventory } from "./inventory.entity";
import { InventoryMovement } from "./inventory-movement.entity";

@Entity("warehouses")
export class Warehouse {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ length: 50, unique: true })
  code!: string;

  @Column({ type: "text", nullable: true })
  address?: string;

  @Column({ length: 100, nullable: true })
  city?: string;

  @Column({ length: 100, nullable: true })
  province?: string;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => Inventory, (inventory) => inventory.warehouse)
  inventories?: Inventory[];

  @OneToMany(() => InventoryMovement, (movement) => movement.warehouse)
  movements?: InventoryMovement[];
}
