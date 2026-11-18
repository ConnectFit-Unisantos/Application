import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    // Mensagem legível: a primeira mensagem de campo vai em `message`,
    // e o detalhamento por campo vai em `fields` / `issues`.
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }

    return res.status(400).json({
      message: err.issues[0]?.message ?? 'Dados inválidos',
      fields,
      issues: err.issues,
    });
  }

  // JSON malformado no corpo da requisição
  if (typeof err === 'object' && err !== null && (err as any).type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Corpo da requisição inválido (JSON malformado)' });
  }

  if (typeof err === 'object' && err !== null && 'statusCode' in err) {
    const anyErr = err as any;
    return res.status(anyErr.statusCode).json({ message: anyErr.message });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ message: 'Erro interno do servidor' });
}
