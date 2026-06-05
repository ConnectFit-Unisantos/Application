"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = require("./routes/auth.routes");
const personal_routes_1 = require("./routes/personal.routes");
const errorHandler_1 = require("./middlewares/errorHandler");
const db_1 = require("./services/db");
const env_1 = require("./config/env");
const app = (0, express_1.default)();
const env = (0, env_1.getEnv)();
(0, db_1.connectDb)().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to connect DB', err);
    process.exit(1);
});
const corsOrigin = env.CORS_ORIGIN ? env.CORS_ORIGIN : true;
app.use((0, cors_1.default)({ origin: corsOrigin, credentials: true }));
app.use(express_1.default.json({ limit: '1mb' }));
app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
});
app.use('/api/auth', auth_routes_1.authRoutes);
app.use('/api/auth', personal_routes_1.personalRoutes);
app.use(errorHandler_1.errorHandler);
const port = env.PORT;
// env.PORT já valida se existe e é numérico positivo
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`connectfit-server running on http://localhost:${port}`);
});
exports.default = app;
