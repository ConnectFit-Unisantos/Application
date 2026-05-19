"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAluno = registerAluno;
exports.login = login;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
function signToken(payload) {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('JWT_SECRET is not set');
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
    // Tipagem do jsonwebtoken pode variar; para evitar conflito de tipos no TS,
    // passamos expiresIn como qualquer.
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: expiresIn });
}
async function registerAluno(input) {
    const existing = await User_1.User.findOne({ email: input.email });
    if (existing) {
        const e = new Error('Email já cadastrado');
        e.statusCode = 409;
        throw e;
    }
    const senhaHash = await bcryptjs_1.default.hash(input.senha, 10);
    const user = await User_1.User.create({
        nome: input.nome,
        email: input.email,
        senhaHash,
        tipo: 'aluno'
    });
    const token = signToken({ sub: String(user._id), tipo: user.tipo });
    return {
        token,
        user: {
            id: String(user._id),
            nome: user.nome,
            email: user.email,
            tipo: user.tipo,
            criadoEm: user.criadoEm
        }
    };
}
async function login(input) {
    const user = await User_1.User.findOne({ email: input.email });
    if (!user) {
        const e = new Error('Credenciais inválidas');
        e.statusCode = 401;
        throw e;
    }
    const ok = await bcryptjs_1.default.compare(input.senha, user.senhaHash);
    if (!ok) {
        const e = new Error('Credenciais inválidas');
        e.statusCode = 401;
        throw e;
    }
    const token = signToken({ sub: String(user._id), tipo: user.tipo });
    return {
        token,
        user: {
            id: String(user._id),
            nome: user.nome,
            email: user.email,
            tipo: user.tipo,
            criadoEm: user.criadoEm
        }
    };
}
