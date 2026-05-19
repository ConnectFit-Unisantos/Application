"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerAlunoSchema = void 0;
const zod_1 = require("zod");
const registerBodySchema = zod_1.z.object({
    nome: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    senha: zod_1.z.string().min(6)
});
const loginBodySchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    senha: zod_1.z.string().min(1)
});
const registerAlunoSchema = (req, _res, next) => {
    req.body = registerBodySchema.parse(req.body);
    return next();
};
exports.registerAlunoSchema = registerAlunoSchema;
const loginSchema = (req, _res, next) => {
    req.body = loginBodySchema.parse(req.body);
    return next();
};
exports.loginSchema = loginSchema;
