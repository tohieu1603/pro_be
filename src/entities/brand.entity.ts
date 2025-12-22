import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Product } from "./product.entity";

@Entity("brands")
export class Brand {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ length: 200, unique: true })
  slug!: string;

  @Column({ name: "logo_url", length: 500, nullable: true })
  logoUrl?: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ length: 500, nullable: true })
  website?: string;

  @Column({ length: 100, nullable: true })
  country?: string;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => Product, (product) => product.brand)
  products?: Product[];
}
