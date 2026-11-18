import type { Request, Response } from 'express';

import type { AuthRequest } from '../middlewares/auth.middleware';
import * as agendamentoService from '../services/agendamento.service';
import * as disponibilidadeService from '../services/disponibilidade.service';
import { asyncHandler } from '../utils/asyncHandler';
import { httpError } from '../utils/user';

function userIdOf(req: AuthRequest) {
  const id = req.user?.userId;
  if (!id) throw httpError(401, 'Não autorizado');
  return id;
}

function queryStr(v: unknown): string | undefined {
  return typeof v === 'string' && v ? v : undefined;
}

/** GET /api/agendamentos/personal/:personalId/disponibilidade?inicio=&fim= (pública) */
export const disponibilidadePublica = asyncHandler(async (req: Request, res: Response) => {
  const result = await disponibilidadeService.getDisponibilidadePersonal(
    req.params.personalId,
    queryStr(req.query.inicio),
    queryStr(req.query.fim),
  );
  res.status(200).json(result);
});

/** GET /api/agendamentos/disponibilidade (personal logado) */
export const minhaDisponibilidade = asyncHandler<AuthRequest>(async (req, res) => {
  res.status(200).json(await disponibilidadeService.getMinhaDisponibilidade(userIdOf(req)));
});

/** PUT /api/agendamentos/disponibilidade (personal logado) */
export const salvarDisponibilidade = asyncHandler<AuthRequest>(async (req, res) => {
  res.status(200).json(await disponibilidadeService.salvarMinhaDisponibilidade(userIdOf(req), req.body));
});

/** POST /api/agendamentos (aluno) */
export const criar = asyncHandler<AuthRequest>(async (req, res) => {
  const aula = await agendamentoService.criarAgendamento(userIdOf(req), req.body);
  res.status(201).json({ aula });
});

/** GET /api/agendamentos?escopo=proximas|historico|todas */
export const listar = asyncHandler<AuthRequest>(async (req, res) => {
  const escopoRaw = queryStr(req.query.escopo);
  const escopo = escopoRaw === 'historico' || escopoRaw === 'todas' ? escopoRaw : 'proximas';
  // O papel vem do tipo da conta (fonte: banco, via requireAuth)
  const papel = req.user?.tipo === 'personal' ? 'personal' : 'aluno';
  const aulas = await agendamentoService.listarAgendamentos(userIdOf(req), papel, escopo);
  res.status(200).json({ aulas });
});

/** GET /api/agendamentos/:id */
export const obter = asyncHandler<AuthRequest>(async (req, res) => {
  const aula = await agendamentoService.obterAgendamento(req.params.id, userIdOf(req));
  res.status(200).json({ aula });
});

/** PATCH /api/agendamentos/:id/confirmar (personal) */
export const confirmar = asyncHandler<AuthRequest>(async (req, res) => {
  const aula = await agendamentoService.confirmarAgendamento(req.params.id, userIdOf(req));
  res.status(200).json({ aula });
});

/** PATCH /api/agendamentos/:id/recusar (personal) */
export const recusar = asyncHandler<AuthRequest>(async (req, res) => {
  const aula = await agendamentoService.recusarAgendamento(req.params.id, userIdOf(req), req.body.motivo);
  res.status(200).json({ aula });
});

/** PATCH /api/agendamentos/:id/cancelar (aluno ou personal) */
export const cancelar = asyncHandler<AuthRequest>(async (req, res) => {
  const aula = await agendamentoService.cancelarAgendamento(req.params.id, userIdOf(req), req.body.motivo);
  res.status(200).json({ aula });
});
