"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPerfil = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Não autorizado, token não fornecido.' });
        return;
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: decoded.userId,
            perfilId: decoded.perfilId,
            perfilNome: decoded.perfilNome
        };
        next();
    }
    catch (error) {
        console.error('Erro na verificação do token:', error);
        res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};
exports.protect = protect;
// Novo middleware para verificar perfil
const checkPerfil = (perfisPermitidos) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Não autorizado' });
        }
        // Verifica se o perfil do usuário está na lista de permitidos
        if (perfisPermitidos.includes(req.user.perfilNome)) {
            return next();
        }
        res.status(403).json({ message: 'Acesso negado. Perfil não autorizado.' });
    };
};
exports.checkPerfil = checkPerfil;
