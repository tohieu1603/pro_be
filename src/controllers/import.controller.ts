import { Request, Response } from "express";
import { productImportService } from "../services/product-import.service";

export class ImportController {
  // Import products from Excel file
  async importProducts(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng upload file Excel",
        });
      }

      const result = await productImportService.importFromExcel(req.file.buffer);

      return res.json({
        success: result.success,
        message: result.success
          ? `Import thành công: ${result.productsCreated} sản phẩm, ${result.variantsCreated} biến thể`
          : "Import có lỗi, vui lòng kiểm tra chi tiết",
        data: {
          productsCreated: result.productsCreated,
          variantsCreated: result.variantsCreated,
          errors: result.errors,
          warnings: result.warnings,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi import",
        error: error.message,
      });
    }
  }

  // Download Excel template
  async downloadTemplate(req: Request, res: Response) {
    try {
      const buffer = await productImportService.generateTemplate();

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=product-import-template.xlsx"
      );

      return res.send(buffer);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Lỗi tạo template",
        error: error.message,
      });
    }
  }
}

export const importController = new ImportController();
