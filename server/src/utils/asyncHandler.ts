import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** Encaminha erros de handlers async para o errorHandler central. */
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req as Req, res, next).catch(next);
  };
}
