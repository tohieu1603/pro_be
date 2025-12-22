import { AppDataSource } from "../data-source";
import {
  Inventory,
  InventoryMovement,
  MovementType,
} from "../entities";
import { BaseService, PaginatedResult } from "./base.service";
import { InventoryQuery } from "../types/query.types";
import { BusinessErrors } from "../utils/errors";
import { withTransaction } from "../utils/transaction-manager";

export class InventoryService extends BaseService<Inventory> {
  protected entityName = "Inventory";
  private movementRepository = AppDataSource.getRepository(InventoryMovement);

  constructor() {
    super(AppDataSource.getRepository(Inventory));
  }

  async findPaginatedInventory(
    query: InventoryQuery
  ): Promise<PaginatedResult<Inventory>> {
    const qb = this.repository
      .createQueryBuilder("inventory")
      .leftJoinAndSelect("inventory.variant", "variant")
      .leftJoinAndSelect("variant.product", "product")
      .leftJoinAndSelect("inventory.warehouse", "warehouse");

    if (query.warehouseId) {
      qb.andWhere("inventory.warehouseId = :warehouseId", {
        warehouseId: query.warehouseId,
      });
    }

    if (query.variantId) {
      qb.andWhere("inventory.variantId = :variantId", {
        variantId: query.variantId,
      });
    }

    if (query.lowStock) {
      qb.andWhere("inventory.quantity <= variant.lowStockThreshold");
    }

    if (query.search) {
      qb.andWhere(
        "(variant.sku ILIKE :search OR product.name ILIKE :search)",
        { search: `%${query.search}%` }
      );
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);
    qb.orderBy("inventory.updatedAt", "DESC");

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInventoryByVariant(variantId: string): Promise<Inventory[]> {
    return this.repository.find({
      where: { variantId },
      relations: ["warehouse"],
    });
  }

  async getInventoryByWarehouse(warehouseId: string): Promise<Inventory[]> {
    return this.repository.find({
      where: { warehouseId },
      relations: ["variant", "variant.product"],
    });
  }

  async updateInventory(
    variantId: string,
    warehouseId: string,
    quantity: number,
    type: MovementType,
    note?: string,
    createdBy?: string
  ): Promise<Inventory> {
    let inventory = await this.findOne({ variantId, warehouseId });

    if (!inventory) {
      inventory = await this.create({
        variantId,
        warehouseId,
        quantity: 0,
        reservedQuantity: 0,
      });
    }

    let newQuantity = inventory.quantity;
    switch (type) {
      case MovementType.IN:
        newQuantity += quantity;
        break;
      case MovementType.OUT:
        newQuantity = Math.max(0, newQuantity - quantity);
        break;
      case MovementType.ADJUSTMENT:
        newQuantity = quantity;
        break;
    }

    // Create movement record
    await this.movementRepository.save({
      variantId,
      warehouseId,
      type,
      quantity,
      note,
      createdBy,
    });

    // Update inventory
    await this.repository.update(inventory.id, { quantity: newQuantity });

    return this.findById(inventory.id) as Promise<Inventory>;
  }

  async transferInventory(
    variantId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    note?: string,
    createdBy?: string
  ): Promise<{ from: Inventory; to: Inventory }> {
    // Validate same warehouse transfer
    if (fromWarehouseId === toWarehouseId) {
      throw BusinessErrors.INVALID_TRANSFER("Cannot transfer to the same warehouse");
    }

    // Check source inventory has enough stock
    const sourceInventory = await this.findOne({ variantId, warehouseId: fromWarehouseId });
    if (!sourceInventory) {
      throw BusinessErrors.INVALID_TRANSFER("Source inventory not found");
    }

    const availableQty = sourceInventory.quantity - sourceInventory.reservedQuantity;
    if (availableQty < quantity) {
      throw BusinessErrors.INSUFFICIENT_STOCK(
        variantId,
        availableQty,
        quantity
      );
    }

    // Execute transfer in transaction
    return withTransaction(async ({ manager }) => {
      // Deduct from source warehouse
      const from = await this.updateInventory(
        variantId,
        fromWarehouseId,
        quantity,
        MovementType.OUT,
        `Transfer to warehouse: ${toWarehouseId}. ${note || ""}`,
        createdBy
      );

      // Add to destination warehouse
      const to = await this.updateInventory(
        variantId,
        toWarehouseId,
        quantity,
        MovementType.IN,
        `Transfer from warehouse: ${fromWarehouseId}. ${note || ""}`,
        createdBy
      );

      return { from, to };
    });
  }

  async reserveStock(
    variantId: string,
    warehouseId: string,
    quantity: number
  ): Promise<boolean> {
    const inventory = await this.findOne({ variantId, warehouseId });
    if (!inventory) {
      throw BusinessErrors.INSUFFICIENT_STOCK(variantId, 0, quantity);
    }

    const availableQuantity = inventory.quantity - inventory.reservedQuantity;
    if (availableQuantity < quantity) {
      throw BusinessErrors.INSUFFICIENT_STOCK(variantId, availableQuantity, quantity);
    }

    await this.repository.update(inventory.id, {
      reservedQuantity: inventory.reservedQuantity + quantity,
    });
    await this.invalidateEntityCache(inventory.id);

    return true;
  }

  async releaseReservedStock(
    variantId: string,
    warehouseId: string,
    quantity: number
  ): Promise<boolean> {
    const inventory = await this.findOne({ variantId, warehouseId });
    if (!inventory) return false;

    const newReserved = Math.max(0, inventory.reservedQuantity - quantity);
    await this.repository.update(inventory.id, {
      reservedQuantity: newReserved,
    });

    return true;
  }

  async getMovementHistory(
    variantId?: string,
    warehouseId?: string,
    limit = 50
  ): Promise<InventoryMovement[]> {
    const qb = this.movementRepository
      .createQueryBuilder("movement")
      .leftJoinAndSelect("movement.variant", "variant")
      .leftJoinAndSelect("movement.warehouse", "warehouse");

    if (variantId) {
      qb.andWhere("movement.variantId = :variantId", { variantId });
    }

    if (warehouseId) {
      qb.andWhere("movement.warehouseId = :warehouseId", { warehouseId });
    }

    qb.orderBy("movement.createdAt", "DESC").take(limit);

    return qb.getMany();
  }

  async getLowStockItems(warehouseId?: string): Promise<Inventory[]> {
    const qb = this.repository
      .createQueryBuilder("inventory")
      .leftJoinAndSelect("inventory.variant", "variant")
      .leftJoinAndSelect("variant.product", "product")
      .leftJoinAndSelect("inventory.warehouse", "warehouse")
      .where("inventory.quantity <= variant.lowStockThreshold");

    if (warehouseId) {
      qb.andWhere("inventory.warehouseId = :warehouseId", { warehouseId });
    }

    return qb.getMany();
  }
}

export const inventoryService = new InventoryService();
