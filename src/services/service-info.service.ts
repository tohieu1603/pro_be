import { AppDataSource } from "../data-source";
import { ServiceInfo } from "../entities";
import { BaseService } from "./base.service";

export class ServiceInfoService extends BaseService<ServiceInfo> {
  protected entityName = "ServiceInfo";

  constructor() {
    super(AppDataSource.getRepository(ServiceInfo));
  }

  async getActiveServices(): Promise<ServiceInfo[]> {
    return this.repository.find({
      where: { isActive: true },
      order: { displayOrder: "ASC" },
    });
  }

  async getServicesForProduct(productId: string, categoryId?: string, brandId?: string): Promise<ServiceInfo[]> {
    const services = await this.getActiveServices();

    return services.filter((service) => {
      if (service.appliesTo === "all") return true;
      if (service.appliesTo === "product" && service.targetIds?.includes(productId)) return true;
      if (service.appliesTo === "category" && categoryId && service.targetIds?.includes(categoryId)) return true;
      if (service.appliesTo === "brand" && brandId && service.targetIds?.includes(brandId)) return true;
      return false;
    });
  }
}

export const serviceInfoService = new ServiceInfoService();
