import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Product } from "./product.entity";
import { AttributeDefinition } from "./attribute-definition.entity";

@Entity("product_attributes")
@Unique(["productId", "attributeId"])
export class ProductAttribute {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.attributes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "product_id" })
  product?: Product;

  @Column({ name: "attribute_id", type: "uuid" })
  attributeId!: string;

  @ManyToOne(() => AttributeDefinition, (attr) => attr.productAttributes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "attribute_id" })
  attribute?: AttributeDefinition;

  @Column({ type: "text" })
  value!: string;
}
