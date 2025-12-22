import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { FlashSaleItem } from "./flash-sale-item.entity";

@Entity("flash_sales")
export class FlashSale {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ name: "starts_at", type: "timestamptz" })
  startsAt!: Date;

  @Column({ name: "ends_at", type: "timestamptz" })
  endsAt!: Date;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => FlashSaleItem, (item) => item.flashSale)
  items?: FlashSaleItem[];
}
