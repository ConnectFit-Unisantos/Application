"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalRoutes = void 0;
const express_1 = require("express");
const personal_controller_1 = require("../controllers/personal.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const auth_validators_1 = require("../validators/auth.validators");
exports.personalRoutes = (0, express_1.Router)();
// Listagem pública (Home busca)
exports.personalRoutes.get('/personals', (req, res, next) => (0, personal_controller_1.listPersonals)(req, res, next));
// Ativação de personal (precisa estar logado)
exports.personalRoutes.post('/personal/activate', auth_middleware_1.requireAuth, auth_validators_1.personalActivateSchema, personal_controller_1.activatePersonal);
