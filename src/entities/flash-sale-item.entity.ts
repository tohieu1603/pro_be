import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { FlashSale } from "./flash-sale.entity";
import { ProductVariant } from "./product-variant.entity";

@Entity("flash_sale_items")
@Unique(["flashSaleId", "variantId"])
export class FlashSaleItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "flash_sale_id", type: "uuid" })
  flashSaleId!: string;

  @ManyToOne(() => FlashSale, (sale) => sale.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "flash_sale_id" })
  flashSale?: FlashSale;

  @Column({ name: "variant_id", type: "uuid" })
  variantId!: string;

  @ManyToOne(() => ProductVariant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "variant_id" })
  variant?: ProductVariant;

  @Column({ name: "sale_price", type: "decimal", precision: 15, scale: 2 })
  salePrice!: number;

  @Column({ name: "quantity_limit", nullable: true })
  quantityLimit?: number;

  @Column({ name: "quantity_sold", default: 0 })
  quantitySold!: number;

  @Column({ name: "per_customer_limit", default: 1 })
  perCustomerLimit!: number;
}
