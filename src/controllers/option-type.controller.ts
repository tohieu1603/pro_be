import { Request, Response } from "express";
import { optionTypeService } from "../services";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendDeleted,
} from "../utils/api-response";

export class OptionTypeController {
  async getAll(req: Request, res: Response) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "ASC",
      };

      if (req.query.all === "true") {
        const optionTypes = await optionTypeService.getAllOptionTypes();
        return sendSuccess(res, optionTypes);
      }

      const result = await optionTypeService.findPaginatedOptionTypes(query);
      return sendSuccess(res, result.data, undefined, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      return sendError(res, "Failed to fetch option types", 500);
    }
  }

  async getByCategory(req: Request, res: Response) {
    try {
      const optionTypes = await optionTypeService.getOptionTypesByCategory(
        req.params.categoryId
      );
      return sendSuccess(res, optionTypes);
    } catch (error) {
      return sendError(res, "Failed to fetch option types", 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const optionType = await optionTypeService.findById(req.params.id, ["values"]);
      if (!optionType) {
        return sendError(res, "Option type not found", 404);
      }
      return sendSuccess(res, optionType);
    } catch (error) {
      return sendError(res, "Failed to fetch option type", 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const optionType = await optionTypeService.createOptionType(req.body);
      return sendCreated(res, optionType);
    } catch (error: any) {
      if (error.code === "23505") {
        return sendError(res, "Option type with this slug already exists", 400);
      }
      return sendError(res, error.message || "Failed to create option type", 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const optionType = await optionTypeService.updateOptionType(
        req.params.id,
        req.body
      );
      return sendSuccess(res, optionType, "Option type updated successfully");
    } catch (error: any) {
      if (error.code === "23505") {
        return sendError(res, "Option type with this slug already exists", 400);
      }
      return sendError(res, error.message || "Failed to update option type", 500);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deleted = await optionTypeService.delete(req.params.id);
      if (!deleted) {
        return sendError(res, "Option type not found", 404);
      }
      return sendDeleted(res);
    } catch (error) {
      return sendError(res, "Failed to delete option type", 500);
    }
  }

  // Option Values
  async getValues(req: Request, res: Response) {
    try {
      const values = await optionTypeService.getOptionValues(req.params.optionTypeId);
      return sendSuccess(res, values);
    } catch (error) {
      return sendError(res, "Failed to fetch option values", 500);
    }
  }

  async createValue(req: Request, res: Response) {
    try {
      const value = await optionTypeService.createOptionValue({
        optionTypeId: req.params.optionTypeId,
        ...req.body,
      });
      return sendCreated(res, value);
    } catch (error: any) {
      return sendError(res, error.message || "Failed to create option value", 500);
    }
  }

  async createValues(req: Request, res: Response) {
    try {
      const { values } = req.body;
      if (!values || !Array.isArray(values)) {
        return sendError(res, "Values array is required", 400);
      }

      const createdValues = await optionTypeService.createOptionValues(
        req.params.optionTypeId,
        values
      );
      return sendCreated(res, createdValues);
    } catch (error: any) {
      return sendError(res, error.message || "Failed to create option values", 500);
    }
  }

  async findOrCreateValues(req: Request, res: Response) {
    try {
      const { values } = req.body;
      if (!values || !Array.isArray(values)) {
        return sendError(res, "Values array is required", 400);
      }

      const result = await optionTypeService.findOrCreateValues(
        req.params.optionTypeId,
        values
      );
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message || "Failed to find/create option values", 500);
    }
  }

  async updateValue(req: Request, res: Response) {
    try {
      const value = await optionTypeService.updateOptionValue(
        req.params.valueId,
        req.body
      );
      return sendSuccess(res, value, "Option value updated successfully");
    } catch (error: any) {
      return sendError(res, error.message || "Failed to update option value", 500);
    }
  }

  async deleteValue(req: Request, res: Response) {
    try {
      const deleted = await optionTypeService.deleteOptionValue(req.params.valueId);
      if (!deleted) {
        return sendError(res, "Option value not found", 404);
      }
      return sendDeleted(res);
    } catch (error) {
      return sendError(res, "Failed to delete option value", 500);
    }
  }
}

export const optionTypeController = new OptionTypeController();
