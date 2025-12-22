import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { VariantOptionValue } from "./variant-option-value.entity";

@Entity("variant_option_types")
export class VariantOptionType {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 100, unique: true })
  slug!: string;

  @Column({ name: "display_order", default: 0 })
  displayOrder!: number;

  @Column({ name: "category_ids", type: "uuid", array: true, nullable: true })
  categoryIds?: string[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => VariantOptionValue, (value) => value.optionType)
  values?: VariantOptionValue[];
}
