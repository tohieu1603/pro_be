import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Product } from "./product.entity";
import { AttributeDefinition } from "./attribute-definition.entity";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "parent_id", type: "uuid", nullable: true })
  parentId?: string;

  @ManyToOne(() => Category, (category) => category.children, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "parent_id" })
  parent?: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children?: Category[];

  @Column({ length: 200 })
  name!: string;

  @Column({ length: 200 })
  slug!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "image_url", length: 500, nullable: true })
  imageUrl?: string;

  @Column({ name: "display_order", default: 0 })
  displayOrder!: number;

  @Column({ type: "text", nullable: true })
  path?: string;

  @Column({ default: 0 })
  level!: number;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => Product, (product) => product.category)
  products?: Product[];

  @OneToMany(() => AttributeDefinition, (attr) => attr.category)
  attributeDefinitions?: AttributeDefinition[];
}
