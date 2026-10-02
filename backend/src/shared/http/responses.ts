import { Response } from 'express';

export type ApiSuccessResponse<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
): Response<ApiSuccessResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message?: string,
): Response<ApiSuccessResponse<T>> {
  return sendSuccess(res, data, 201, message);
}
