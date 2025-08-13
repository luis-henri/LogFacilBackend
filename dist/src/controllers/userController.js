"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.getAllPerfis = exports.updateUser = exports.getAllUsers = void 0;
const prisma_1 = require("../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Busca todos os utilizadores do sistema.
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma_1.prisma.usuario.findMany({
            select: {
                id_usuario: true,
                nome_usuario: true,
                email_usuario: true,
                cpf_usuario: true,
                data_cadastro_usuario: true,
                situacao: {
                    select: { descricao_situacao_usuario: true }
                },
                // Inclui a informação do perfil na resposta
                perfis: {
                    select: {
                        perfil: {
                            select: {
                                id_perfil: true,
                                nome_perfil: true
                            }
                        }
                    }
                }
            },
            orderBy: { nome_usuario: 'asc' }
        });
        res.status(200).json(users);
    }
    catch (error) {
        console.error("Erro ao buscar utilizadores:", error);
        res.status(500).json({ message: "Erro interno ao buscar utilizadores." });
    }
};
exports.getAllUsers = getAllUsers;
/**
 * Atualiza um utilizador existente.
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, cpf, senha, ativo, perfilId } = req.body;
        const dataToUpdate = {
            nome_usuario: nome,
            email_usuario: email,
            cpf_usuario: cpf,
            id_situacao_usuario: ativo ? 1 : 2
        };
        if (senha && senha.trim() !== '') {
            dataToUpdate.senha_hash = await bcryptjs_1.default.hash(senha, 10);
        }
        // Atualiza os dados do utilizador
        const updatedUser = await prisma_1.prisma.usuario.update({
            where: { id_usuario: parseInt(id, 10) },
            data: dataToUpdate
        });
        // Se um novo perfilId foi enviado, atualiza a associação
        if (perfilId) {
            // Remove todas as associações de perfil existentes para este utilizador
            await prisma_1.prisma.usuarioPerfil.deleteMany({
                where: { id_usuario: parseInt(id, 10) }
            });
            // Cria a nova associação
            await prisma_1.prisma.usuarioPerfil.create({
                data: {
                    id_usuario: parseInt(id, 10),
                    id_perfil: Number(perfilId)
                }
            });
        }
        res.status(200).json(updatedUser);
    }
    catch (error) {
        console.error(`Erro ao atualizar utilizador ${req.params.id}:`, error);
        res.status(500).json({ message: "Erro ao atualizar utilizador." });
    }
};
exports.updateUser = updateUser;
const getAllPerfis = async (req, res) => {
    try {
        const perfis = await prisma_1.prisma.perfil.findMany({
            orderBy: { nome_perfil: 'asc' }
        });
        res.status(200).json(perfis);
    }
    catch (error) {
        console.error("Erro ao buscar perfis:", error);
        res.status(500).json({ message: "Erro interno ao buscar perfis." });
    }
};
exports.getAllPerfis = getAllPerfis;
// =======================================================================
// NOVA FUNÇÃO: Criar um novo utilizador
// =======================================================================
const createUser = async (req, res) => {
    try {
        const { nome, email, cpf, password, perfilId } = req.body;
        if (!nome || !email || !cpf || !password || !perfilId) {
            res.status(400).json({ message: "Todos os campos, incluindo o perfil, são obrigatórios." });
            return;
        }
        const existingUser = await prisma_1.prisma.usuario.findFirst({
            where: { OR: [{ email_usuario: email }, { cpf_usuario: cpf }] }
        });
        if (existingUser) {
            res.status(409).json({ message: "Email ou CPF já cadastrado." });
            return;
        }
        const senha_hash = await bcryptjs_1.default.hash(password, 10);
        const newUser = await prisma_1.prisma.usuario.create({
            data: {
                nome_usuario: nome,
                email_usuario: email,
                cpf_usuario: cpf,
                senha_hash: senha_hash,
                id_situacao_usuario: 1, // Ativo por padrão
            }
        });
        // Associa o perfil ao utilizador na tabela de junção
        await prisma_1.prisma.usuarioPerfil.create({
            data: {
                id_usuario: newUser.id_usuario,
                id_perfil: Number(perfilId)
            }
        });
        res.status(201).json({ message: "Utilizador criado com sucesso!", userId: newUser.id_usuario });
    }
    catch (error) {
        console.error("Erro ao criar utilizador:", error);
        res.status(500).json({ message: "Erro interno ao criar utilizador." });
    }
};
exports.createUser = createUser;
