"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_validators_1 = require("../validators/auth.validators");
const auth_controller_1 = require("../controllers/auth.controller");
exports.authRoutes = (0, express_1.Router)();
exports.authRoutes.post('/register', auth_validators_1.registerAlunoSchema, auth_controller_1.registerAluno);
exports.authRoutes.post('/login', auth_validators_1.loginSchema, auth_controller_1.login);
