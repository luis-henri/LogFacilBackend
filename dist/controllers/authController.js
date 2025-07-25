"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const prisma_1 = require("../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const register = async (req, res) => {
    console.log('[AUTH] Pedido de registro recebido.');
    const { nome, email, cpf, password } = req.body;
    if (!nome || !email || !cpf || !password) {
        console.log('[AUTH] Falha na validação: Campos em falta.');
        res.status(400).json({ message: "Todos os campos são obrigatórios." });
        return;
    }
    try {
        console.log('[AUTH] A encriptar a senha...');
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        console.log('[AUTH] Senha encriptada com sucesso.');
        console.log('[AUTH] A tentar criar o novo usuário no banco de dados...');
        const newUser = await prisma_1.prisma.usuario.create({
            data: {
                nome_usuario: nome,
                email_usuario: email,
                cpf_usuario: cpf,
                senha_hash: hashedPassword,
                id_situacao_usuario: 1,
                id_cargo_usuario: 1,
            },
        });
        console.log(`[AUTH] Usuário ID ${newUser.id_usuario} criado com sucesso.`);
        res.status(201).json({ message: "Usuário criado com sucesso!", userId: newUser.id_usuario });
    }
    catch (error) {
        console.error("[AUTH] Erro catastrófico durante o registro:", error);
        res.status(500).json({ message: "Erro ao criar usuário. O email ou CPF pode já existir." });
    }
};
exports.register = register;
const login = async (req, res) => {
    const { cpf, password } = req.body;
    if (!cpf || !password) {
        res.status(400).json({ message: "CPF e senha são obrigatórios." });
        return;
    }
    try {
        const user = await prisma_1.prisma.usuario.findUnique({ where: { cpf_usuario: cpf } });
        if (!user || !(await bcryptjs_1.default.compare(password, user.senha_hash))) {
            res.status(401).json({ message: 'CPF ou senha inválidos' });
            return;
        }
        if (!process.env.JWT_SECRET) {
            throw new Error('O segredo JWT não está definido.');
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id_usuario }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({
            message: "Login bem-sucedido!",
            token,
            user: {
                id: user.id_usuario,
                nome: user.nome_usuario,
                email: user.email_usuario
            }
        });
    }
    catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};
exports.login = login;
