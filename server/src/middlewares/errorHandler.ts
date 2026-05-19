import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      issues: err.issues
    });
  }

  if (typeof err === 'object' && err !== null && 'statusCode' in err) {
    const anyErr = err as any;
    return res.status(anyErr.statusCode).json({ message: anyErr.message });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
}

