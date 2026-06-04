"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = getEnv;
function mustGet(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
}
function getEnv() {
    const PORT = Number(process.env.PORT ?? '3333');
    if (Number.isNaN(PORT) || PORT <= 0) {
        throw new Error('Environment variable PORT must be a positive number');
    }
    const MONGODB_URI = mustGet('MONGODB_URI');
    const JWT_SECRET = mustGet('JWT_SECRET');
    // side-effect: garantir que o restante do app continua lendo via process.env
    process.env.MONGODB_URI = MONGODB_URI;
    process.env.JWT_SECRET = JWT_SECRET;
    return {
        PORT,
        MONGODB_URI,
        JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
        CORS_ORIGIN: process.env.CORS_ORIGIN,
    };
}
