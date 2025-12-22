import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from "typeorm";
import { Product } from "./product.entity";

export enum TagType {
  GENERAL = "general",
  BADGE = "badge",
  PROMOTION = "promotion",
}

@Entity("tags")
export class Tag {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 100, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 50, default: TagType.GENERAL })
  type!: TagType;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToMany(() => Product, (product) => product.tags)
  products?: Product[];
}
