import { User } from '../models/User';
import type { PersonalActivateInput } from '../validators/auth.validators';
import { normalizeTags, parsePreco } from '../utils/text';
import { httpError, signToken, toPublicUser } from '../utils/user';
import { diasAtendimentoLista, horariosSemanais } from './disponibilidade.service';

export async function activatePersonal(input: PersonalActivateInput & { userId: string }) {
  const user = await User.findById(input.userId);
  if (!user) {
    throw httpError(404, 'Usuário não encontrado');
  }

  user.tipo = 'personal';

  user.formacao = input.formacao.map((s) => s.trim()).filter(Boolean);
  user.servicos = normalizeTags(input.servicos);
  user.especializacao = normalizeTags(input.especializacao);
  user.certificacoes = input.certificacoes.map((s) => s.trim()).filter(Boolean);
  user.precoHora = input.precoHora;
  user.disponibilidade = normalizeTags(input.disponibilidade.split(',')).join(', ');
  user.bio = input.bio;
  user.uf = input.uf;
  user.cidade = input.cidade;

  await user.save();

  // Token novo: o antigo ainda dizia tipo 'aluno'
  const token = signToken({ sub: String(user._id), tipo: 'personal' });

  return { token, user: toPublicUser(user) };
}

export async function listPersonals() {
  const users = await User.find({ tipo: 'personal' }).lean();

  return users.map((u) => {
    const preco = parsePreco(u.precoHora ?? '');
    const temLocal = !!(u.cidade && u.uf);

    return {
      id: String(u._id),
      nome: u.nome,
      // Formato esperado pelo app: "Cidade - UF" (vazio se não cadastrado)
      localizacao: temLocal ? `${u.cidade} - ${u.uf}` : '',
      uf: u.uf ?? '',
      cidade: u.cidade ?? '',
      // Normaliza também dados antigos gravados antes da padronização
      especialidades: normalizeTags(u.especializacao ?? []),
      avaliacao: 0,
      avaliacoes: 0,
      preco: Number.isFinite(preco) ? preco : 0,
      certificado: (u.certificacoes?.length ?? 0) > 0,
      foto: undefined,
      bio: u.bio ?? '',
      // Dias de atendimento vindos da agenda (ou do texto do onboarding, se ainda não configurou)
      disponibilidade: diasAtendimentoLista(horariosSemanais(u)),
    };
  });
}
