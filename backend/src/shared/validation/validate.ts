import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';
import { ValidationError } from '../errors';

type RequestPart = 'body' | 'params' | 'query';

function formatZodError(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

function validateRequestPart(part: RequestPart, schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      next(new ValidationError('Datos de entrada no validos', formatZodError(result.error)));
      return;
    }

    req[part] = result.data;
    next();
  };
}

export const validateBody = (schema: ZodType) => validateRequestPart('body', schema);
export const validateParams = (schema: ZodType) => validateRequestPart('params', schema);
export const validateQuery = (schema: ZodType) => validateRequestPart('query', schema);
