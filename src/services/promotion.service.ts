import { AppDataSource } from "../data-source";
import { Promotion } from "../entities";
import { BaseService } from "./base.service";

export class PromotionService extends BaseService<Promotion> {
  protected entityName = "Promotion";

  constructor() {
    super(AppDataSource.getRepository(Promotion));
  }

  async getActivePromotions(): Promise<Promotion[]> {
    const now = new Date();
    return this.repository.find({
      where: { isActive: true },
      order: { displayOrder: "ASC" },
    });
  }

  async getPromotionsForProduct(productId: string, categoryId?: string, brandId?: string): Promise<Promotion[]> {
    const promotions = await this.getActivePromotions();

    return promotions.filter((promo) => {
      if (promo.appliesTo === "all") return true;
      if (promo.appliesTo === "product" && promo.targetIds?.includes(productId)) return true;
      if (promo.appliesTo === "category" && categoryId && promo.targetIds?.includes(categoryId)) return true;
      if (promo.appliesTo === "brand" && brandId && promo.targetIds?.includes(brandId)) return true;
      return false;
    });
  }
}

export const promotionService = new PromotionService();
