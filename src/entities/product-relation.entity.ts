import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Product } from "./product.entity";

export enum RelationType {
  SIMILAR = "similar",
  ACCESSORY = "accessory",
  BUNDLE = "bundle",
  UPGRADE = "upgrade",
}

@Entity("product_relations")
@Unique(["productId", "relatedProductId", "relationType"])
export class ProductRelation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product?: Product;

  @Column({ name: "related_product_id", type: "uuid" })
  relatedProductId!: string;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "related_product_id" })
  relatedProduct?: Product;

  @Column({ name: "relation_type", type: "varchar", length: 50 })
  relationType!: RelationType;

  @Column({ name: "display_order", default: 0 })
  displayOrder!: number;
}
