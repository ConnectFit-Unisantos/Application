"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
function errorHandler(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            message: 'Validation error',
            issues: err.issues
        });
    }
    if (typeof err === 'object' && err !== null && 'statusCode' in err) {
        const anyErr = err;
        return res.status(anyErr.statusCode).json({ message: anyErr.message });
    }
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
}
