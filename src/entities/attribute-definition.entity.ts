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
import { Category } from "./category.entity";
import { ProductAttribute } from "./product-attribute.entity";

export enum AttributeDataType {
  TEXT = "text",
  NUMBER = "number",
  BOOLEAN = "boolean",
  SELECT = "select",
}

@Entity("attribute_definitions")
export class AttributeDefinition {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "category_id", type: "uuid", nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, (category) => category.attributeDefinitions, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "category_id" })
  category?: Category;

  @Column({ length: 200 })
  name!: string;

  @Column({ length: 200 })
  slug!: string;

  @Column({
    name: "data_type",
    type: "varchar",
    length: 50,
    default: AttributeDataType.TEXT,
  })
  dataType!: AttributeDataType;

  @Column({ length: 50, nullable: true })
  unit?: string;

  @Column({ name: "possible_values", type: "jsonb", nullable: true })
  possibleValues?: string[];

  @Column({ name: "display_group", length: 100, nullable: true })
  displayGroup?: string;

  @Column({ name: "display_order", default: 0 })
  displayOrder!: number;

  @Column({ name: "is_filterable", default: false })
  isFilterable!: boolean;

  @Column({ name: "is_comparable", default: true })
  isComparable!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => ProductAttribute, (attr) => attr.attribute)
  productAttributes?: ProductAttribute[];
}
