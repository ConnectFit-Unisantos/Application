"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activatePersonal = activatePersonal;
exports.listPersonals = listPersonals;
const personalService = __importStar(require("../services/personal.service"));
async function activatePersonal(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Não autorizado' });
        }
        const { formacao, servicos, especializacao, precoHora, disponibilidade, bio, certificacoes, } = req.body;
        const result = await personalService.activatePersonal({
            userId,
            formacao,
            servicos,
            especializacao,
            precoHora,
            disponibilidade,
            bio,
            certificacoes,
        });
        return res.status(200).json(result);
    }
    catch (err) {
        return next(err);
    }
}
async function listPersonals(_req, res, next) {
    try {
        // por enquanto usamos diretamente os dados do modelo
        const users = await (await Promise.resolve().then(() => __importStar(require('../models/User')))).User.find({
            tipo: 'personal',
        }).lean();
        const personals = users.map((u) => ({
            id: String(u._id),
            nome: u.nome,
            // campos que a UI espera (preenchidos com fallback por enquanto)
            localizacao: '',
            especialidades: u.especializacao ?? [],
            avaliacao: 0,
            avaliacoes: 0,
            preco: u.precoHora ? Number(u.precoHora) : 0,
            certificado: (u.certificacoes?.length ?? 0) > 0,
            foto: undefined,
            bio: u.bio ?? '',
        }));
        return res.status(200).json({ personals });
    }
    catch (err) {
        return next(err);
    }
}
