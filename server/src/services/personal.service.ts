import { User } from '../models/User';

export async function activatePersonal(input: {
  userId: string;
  formacao: string[];
  servicos: string[];
  especializacao: string[];
  precoHora: string;
  disponibilidade: string;
  bio: string;
  certificacoes: string[];
  uf: string;
  cidade: string;
}) {

  const user = await User.findById(input.userId);
  if (!user) {
    const e = new Error('Usuário não encontrado');
    (e as any).statusCode = 404;
    throw e;
  }

  user.tipo = 'personal';

  user.formacao = input.formacao;
  user.servicos = input.servicos;
  user.especializacao = input.especializacao;
  user.precoHora = input.precoHora;
  user.disponibilidade = input.disponibilidade;
  user.bio = input.bio;
  user.certificacoes = input.certificacoes;
  user.uf = input.uf;
  user.cidade = input.cidade;


  await user.save();

  return {
    id: String(user._id),
    nome: user.nome,
    email: user.email,
    tipo: user.tipo,
    criadoEm: user.criadoEm,

    formacao: user.formacao,
    servicos: user.servicos,
    especializacao: user.especializacao,
    precoHora: user.precoHora,
    disponibilidade: user.disponibilidade,
    bio: user.bio,
    certificacoes: user.certificacoes,
  };
}



