import type { Request, Response, NextFunction } from 'express';

import * as personalService from '../services/personal.service';
import type { AuthRequest } from '../middlewares/auth.middleware';
import type { PersonalActivateInput } from '../validators/auth.validators';

export async function activatePersonal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    // req.body já foi validado e normalizado por personalActivateSchema
    const body = req.body as PersonalActivateInput;

    const result = await personalService.activatePersonal({ ...body, userId });

    // { token, user } — token novo com tipo 'personal'
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function listPersonals(_req: Request, res: Response, next: NextFunction) {
  try {
    const personals = await personalService.listPersonals();
    return res.status(200).json({ personals });
  } catch (err) {
    return next(err);
  }
}
