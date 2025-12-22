import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { ProductVariant } from "./product-variant.entity";
import { VariantOptionType } from "./variant-option-type.entity";
import { VariantOptionValue } from "./variant-option-value.entity";

@Entity("product_variant_options")
@Unique(["variantId", "optionTypeId"])
export class ProductVariantOption {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "variant_id", type: "uuid" })
  variantId!: string;

  @ManyToOne(() => ProductVariant, (variant) => variant.options, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "variant_id" })
  variant?: ProductVariant;

  @Column({ name: "option_type_id", type: "uuid" })
  optionTypeId!: string;

  @ManyToOne(() => VariantOptionType, { onDelete: "CASCADE" })
  @JoinColumn({ name: "option_type_id" })
  optionType?: VariantOptionType;

  @Column({ name: "option_value_id", type: "uuid" })
  optionValueId!: string;

  @ManyToOne(() => VariantOptionValue, { onDelete: "CASCADE" })
  @JoinColumn({ name: "option_value_id" })
  optionValue?: VariantOptionValue;
}
