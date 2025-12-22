import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { VariantOptionType } from "./variant-option-type.entity";

@Entity("variant_option_values")
export class VariantOptionValue {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "option_type_id", type: "uuid" })
  optionTypeId!: string;

  @ManyToOne(() => VariantOptionType, (type) => type.values, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "option_type_id" })
  optionType?: VariantOptionType;

  @Column({ length: 200 })
  value!: string;

  @Column({ name: "display_value", length: 200, nullable: true })
  displayValue?: string;

  @Column({ name: "color_code", length: 20, nullable: true })
  colorCode?: string;

  @Column({ name: "display_order", default: 0 })
  displayOrder!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
