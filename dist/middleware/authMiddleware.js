"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// CORREÇÃO: Adicionada a tipagem de retorno explícita ': void' e 'return' nas respostas de erro.
// Isto garante a TypeScript que a função ou chama next() ou termina a execução.
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Não autorizado, token não fornecido.' });
        return; // Garante que a função para aqui
    }
    try {
        const token = authHeader.split(' ')[1];
        if (!process.env.JWT_SECRET) {
            // Lançar um erro é uma boa prática aqui, pois é um erro de configuração do servidor
            throw new Error('O segredo JWT não está configurado no servidor.');
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Adiciona os dados decodificados do usuário ao objeto de requisição para uso futuro
        req.user = decoded;
        // Se o token for válido, passa para a próxima função (o controller da rota)
        next();
    }
    catch (error) {
        console.error('Erro de autenticação:', error);
        res.status(401).json({ message: 'Token inválido ou expirado.' });
        return; // Garante que a função para aqui
    }
};
exports.protect = protect;
