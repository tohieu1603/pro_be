import { In, Like } from "typeorm";
import { AppDataSource } from "../data-source";
import { VariantOptionType, VariantOptionValue } from "../entities";
import { BaseService, PaginatedResult } from "./base.service";
import { PaginationQuery } from "../types/query.types";
import { generateSlug } from "../utils/slug";
import { NotFoundError, BusinessErrors } from "../utils/errors";

export class OptionTypeService extends BaseService<VariantOptionType> {
  protected entityName = "OptionType";
  private valueRepository = AppDataSource.getRepository(VariantOptionValue);

  constructor() {
    super(AppDataSource.getRepository(VariantOptionType));
  }

  async findPaginatedOptionTypes(
    query: PaginationQuery & { categoryId?: string }
  ): Promise<PaginatedResult<VariantOptionType>> {
    const where: any = {};

    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }

    return this.findPaginated(query, where, ["values"], {
      tags: [`${this.entityName}:list`],
    });
  }

  async getAllOptionTypes(): Promise<VariantOptionType[]> {
    return this.repository.find({
      relations: ["values"],
      order: {
        displayOrder: "ASC",
        name: "ASC",
        values: { displayOrder: "ASC" },
      },
    });
  }

  async getOptionTypesByCategory(categoryId: string): Promise<VariantOptionType[]> {
    // Get all option types that have this category in their categoryIds array
    const allTypes = await this.repository.find({
      relations: ["values"],
      order: { displayOrder: "ASC" },
    });

    return allTypes.filter(
      (type) => !type.categoryIds || type.categoryIds.length === 0 || type.categoryIds.includes(categoryId)
    );
  }

  async createOptionType(data: Partial<VariantOptionType>): Promise<VariantOptionType> {
    if (!data.slug && data.name) {
      data.slug = generateSlug(data.name);
    }

    const existing = await this.findOne({ slug: data.slug });
    if (existing) {
      throw BusinessErrors.DUPLICATE_SLUG(data.slug!);
    }

    return this.create(data);
  }

  async updateOptionType(id: string, data: Partial<VariantOptionType>): Promise<VariantOptionType> {
    const optionType = await this.findById(id);
    if (!optionType) {
      throw new NotFoundError(this.entityName, id);
    }

    if (data.name && !data.slug) {
      data.slug = generateSlug(data.name);
    }

    if (data.slug && data.slug !== optionType.slug) {
      const existing = await this.findOne({ slug: data.slug });
      if (existing) {
        throw BusinessErrors.DUPLICATE_SLUG(data.slug);
      }
    }

    const updated = await this.update(id, data);
    return updated!;
  }

  // Option Values
  async getOptionValues(optionTypeId: string): Promise<VariantOptionValue[]> {
    return this.valueRepository.find({
      where: { optionTypeId },
      order: { displayOrder: "ASC", value: "ASC" },
    });
  }

  async createOptionValue(data: Partial<VariantOptionValue>): Promise<VariantOptionValue> {
    const optionType = await this.findById(data.optionTypeId!);
    if (!optionType) {
      throw new NotFoundError("OptionType", data.optionTypeId!);
    }

    const value = this.valueRepository.create(data);
    return this.valueRepository.save(value);
  }

  async createOptionValues(
    optionTypeId: string,
    values: Array<{ value: string; displayValue?: string; colorCode?: string }>
  ): Promise<VariantOptionValue[]> {
    const optionType = await this.findById(optionTypeId);
    if (!optionType) {
      throw new NotFoundError("OptionType", optionTypeId);
    }

    // Get current max display order
    const existingValues = await this.getOptionValues(optionTypeId);
    const maxOrder = existingValues.length > 0
      ? Math.max(...existingValues.map((v) => v.displayOrder))
      : -1;

    const newValues = values.map((v, index) =>
      this.valueRepository.create({
        optionTypeId,
        value: v.value,
        displayValue: v.displayValue || v.value,
        colorCode: v.colorCode,
        displayOrder: maxOrder + index + 1,
      })
    );

    return this.valueRepository.save(newValues);
  }

  async updateOptionValue(id: string, data: Partial<VariantOptionValue>): Promise<VariantOptionValue> {
    const value = await this.valueRepository.findOneBy({ id });
    if (!value) {
      throw new NotFoundError("OptionValue", id);
    }

    Object.assign(value, data);
    return this.valueRepository.save(value);
  }

  async deleteOptionValue(id: string): Promise<boolean> {
    const result = await this.valueRepository.delete(id);
    return result.affected === 1;
  }

  async getValuesByIds(ids: string[]): Promise<VariantOptionValue[]> {
    if (!ids || ids.length === 0) return [];
    return this.valueRepository.find({
      where: { id: In(ids) },
      relations: ["optionType"],
    });
  }

  async findOrCreateValues(
    optionTypeId: string,
    values: string[]
  ): Promise<VariantOptionValue[]> {
    const optionType = await this.findById(optionTypeId);
    if (!optionType) {
      throw new NotFoundError("OptionType", optionTypeId);
    }

    const result: VariantOptionValue[] = [];
    const existingValues = await this.getOptionValues(optionTypeId);
    let maxOrder = existingValues.length > 0
      ? Math.max(...existingValues.map((v) => v.displayOrder))
      : -1;

    for (const val of values) {
      const normalizedValue = val.trim();
      let existing = existingValues.find(
        (v) => v.value.toLowerCase() === normalizedValue.toLowerCase()
      );

      if (!existing) {
        existing = this.valueRepository.create({
          optionTypeId,
          value: normalizedValue,
          displayValue: normalizedValue,
          displayOrder: ++maxOrder,
        });
        await this.valueRepository.save(existing);
      }

      result.push(existing);
    }

    return result;
  }
}

export const optionTypeService = new OptionTypeService();
