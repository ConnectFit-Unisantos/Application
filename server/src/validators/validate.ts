import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';

/** Valida e normaliza req.body com um schema Zod (erros vão para o errorHandler). */
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body ?? {});
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
