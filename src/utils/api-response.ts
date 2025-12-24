import { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: PaginationMeta;
  errors?: unknown[];
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  meta?: PaginationMeta,
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    meta,
  } as ApiResponse<T>);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: unknown[]
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  } as ApiResponse);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = "Created successfully"
): Response => {
  return sendSuccess(res, data, message, undefined, 201);
};

export const sendDeleted = (
  res: Response,
  message = "Deleted successfully"
): Response => {
  return sendSuccess(res, null, message);
};

export const sendNotFound = (
  res: Response,
  resource = "Resource"
): Response => {
  return sendError(res, `${resource} not found`, 404);
};
