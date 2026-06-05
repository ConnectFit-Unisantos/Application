"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activatePersonal = activatePersonal;
const User_1 = require("../models/User");
async function activatePersonal(input) {
    const user = await User_1.User.findById(input.userId);
    if (!user) {
        const e = new Error('Usuário não encontrado');
        e.statusCode = 404;
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
