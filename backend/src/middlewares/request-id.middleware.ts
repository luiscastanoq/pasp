import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const headerRequestId = req.header('x-request-id');
  const requestId = headerRequestId?.trim() || randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  next();
};
