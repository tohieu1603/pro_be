import { Like } from "typeorm";
import { AppDataSource } from "../data-source";
import { Warehouse } from "../entities";
import { BaseService, PaginatedResult } from "./base.service";
import { PaginationQuery } from "../types/query.types";
import { NotFoundError, BusinessErrors } from "../utils/errors";

export class WarehouseService extends BaseService<Warehouse> {
  protected entityName = "Warehouse";

  constructor() {
    super(AppDataSource.getRepository(Warehouse));
  }

  async findPaginatedWarehouses(
    query: PaginationQuery
  ): Promise<PaginatedResult<Warehouse>> {
    const where: any = {};

    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }

    return this.findPaginated(query, where, undefined, {
      tags: [`${this.entityName}:list`],
    });
  }

  async createWarehouse(data: Partial<Warehouse>): Promise<Warehouse> {
    // Check for duplicate code
    if (data.code) {
      const existing = await this.findOne({ code: data.code });
      if (existing) {
        throw BusinessErrors.DUPLICATE_SKU(data.code);
      }
    }

    return this.create(data);
  }

  async updateWarehouse(id: string, data: Partial<Warehouse>): Promise<Warehouse> {
    const warehouse = await this.findById(id);
    if (!warehouse) {
      throw new NotFoundError(this.entityName, id);
    }

    // Check for duplicate code if changing
    if (data.code && data.code !== warehouse.code) {
      const existing = await this.findOne({ code: data.code });
      if (existing) {
        throw BusinessErrors.DUPLICATE_SKU(data.code);
      }
    }

    const updated = await this.update(id, data);
    return updated!;
  }

  async deleteWarehouse(id: string): Promise<boolean> {
    const warehouse = await this.findById(id);
    if (!warehouse) {
      throw new NotFoundError(this.entityName, id);
    }

    // Check if warehouse has inventory
    const inventoryCount = await AppDataSource.getRepository("Inventory").count({
      where: { warehouseId: id },
    });

    if (inventoryCount > 0) {
      throw BusinessErrors.WAREHOUSE_HAS_INVENTORY(id);
    }

    return this.delete(id);
  }

  async findByCode(code: string): Promise<Warehouse | null> {
    return this.findOne({ code });
  }

  async getActiveWarehouses(): Promise<Warehouse[]> {
    return this.findAll(
      {
        where: { isActive: true },
        order: { name: "ASC" },
      },
      { tags: [`${this.entityName}:active`] }
    );
  }
}

export const warehouseService = new WarehouseService();
