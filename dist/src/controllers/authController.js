"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const login = async (req, res) => {
    const { cpf, password } = req.body;
    if (!cpf || !password) {
        return res.status(400).json({ message: 'CPF e senha são obrigatórios.' });
    }
    try {
        // =======================================================================
        // CORREÇÃO 1: Usar .trim() para remover espaços em branco do CPF
        // =======================================================================
        const user = await prisma.usuario.findUnique({
            where: { cpf_usuario: cpf.trim() },
            include: {
                perfis: {
                    include: {
                        perfil: true,
                    },
                },
            },
        });
        // =======================================================================
        // CORREÇÃO 2: Usar .trim() na senha ANTES de comparar com o hash
        // =======================================================================
        if (!user || !(await bcryptjs_1.default.compare(password.trim(), user.senha_hash))) {
            return res.status(401).json({ message: 'CPF ou senha inválidos.' });
        }
        if (!user.perfis || user.perfis.length === 0) {
            return res.status(403).json({ message: 'Usuário não possui um perfil de acesso.' });
        }
        const perfilAtivo = user.perfis[0].perfil;
        const payload = {
            userId: user.id_usuario,
            perfilId: perfilAtivo.id_perfil,
            perfilNome: perfilAtivo.nome_perfil,
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '8h',
        });
        res.json({
            message: 'Login bem-sucedido!',
            token,
            user: {
                id: user.id_usuario,
                email: user.email_usuario,
                nome: user.nome_usuario,
                perfil: {
                    id: perfilAtivo.id_perfil,
                    nome: perfilAtivo.nome_perfil,
                },
            },
        });
    }
    catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};
exports.login = login;
