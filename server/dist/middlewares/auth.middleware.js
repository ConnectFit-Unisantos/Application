"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Não autorizado' });
        }
        const token = authHeader.slice('Bearer '.length);
        const { JWT_SECRET } = (0, env_1.getEnv)();
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const userId = payload.sub;
        const tipo = payload.tipo;
        if (!userId || !tipo) {
            return res.status(401).json({ message: 'Não autorizado' });
        }
        req.user = { userId, tipo };
        return next();
    }
    catch {
        return res.status(401).json({ message: 'Não autorizado' });
    }
}
