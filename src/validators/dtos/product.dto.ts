/**
 * Product DTOs for validation
 */

import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsEnum,
  IsArray,
  MinLength,
  MaxLength,
  Min,
  IsNotEmpty,
  ValidateNested,
} from "class-validator";
import { Type, Transform, Expose } from "class-transformer";
import { ProductStatus } from "../../entities";

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @IsNotEmpty({ message: "Product name is required" })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  spk?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  shortDescription?: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsUUID()
  @IsNotEmpty({ message: "Category is required" })
  categoryId!: string;

  @IsNumber()
  @Min(0, { message: "Base price must be non-negative" })
  @Type(() => Number)
  basePrice!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  isFeatured?: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  shortDescription?: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  basePrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  isFeatured?: boolean;
}

export class ProductQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isFeatured?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: "ASC" | "DESC";
}

export class ProductIdParamDto {
  @IsUUID()
  id!: string;
}

export class UpdateProductTagsDto {
  @IsArray()
  @IsUUID("4", { each: true })
  tagIds!: string[];
}
