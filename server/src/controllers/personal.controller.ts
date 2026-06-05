import type { Response, NextFunction } from 'express';

import * as personalService from '../services/personal.service';
import type { AuthRequest } from '../middlewares/auth.middleware';

export async function activatePersonal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    const {
      formacao,
      servicos,
      especializacao,
      precoHora,
      disponibilidade,
      bio,
      certificacoes,
      uf,
      cidade,
    } = req.body as {
      formacao: string[];
      servicos: string[];
      especializacao: string[];
      precoHora: string;
      disponibilidade: string;
      bio: string;
      certificacoes: string[];
      uf: string;
      cidade: string;
    };

    const result = await personalService.activatePersonal({
      userId,
      formacao,
      servicos,
      especializacao,
      precoHora,
      disponibilidade,
      bio,
      certificacoes,
      uf,
      cidade,
    });

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function listPersonals(_req: Request, res: Response, next: NextFunction) {
  try {
    // por enquanto usamos diretamente os dados do modelo
    const users = await (await import('../models/User')).User.find({
      tipo: 'personal',
    }).lean();

    const personals = users.map((u) => ({ 
      id: String(u._id),
      nome: u.nome,
      // campos que a UI espera
      // Formato esperado pelo app: "Cidade - UF"
      localizacao: u.cidade && u.uf ? `${u.cidade} - ${u.uf}` : '',
      especialidades: u.especializacao ?? [],
      avaliacao: 0,
      avaliacoes: 0,
      preco: u.precoHora ? Number(u.precoHora) : 0,
      certificado: (u.certificacoes?.length ?? 0) > 0,
      foto: undefined,
      bio: u.bio ?? '',
    }));


    return res.status(200).json({ personals });
  } catch (err) {
    return next(err);
  }
}



