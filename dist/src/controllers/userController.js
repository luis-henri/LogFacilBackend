"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.getAllUsers = void 0;
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
                    select: {
                        descricao_situacao_usuario: true
                    }
                }
            },
            orderBy: {
                nome_usuario: 'asc'
            }
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
        const { nome, email, cpf, senha, ativo } = req.body;
        const dataToUpdate = {
            nome_usuario: nome,
            email_usuario: email,
            cpf_usuario: cpf,
            id_situacao_usuario: ativo ? 1 : 2 // Assumindo 1=Ativo, 2=Inativo
        };
        // Se uma nova senha for fornecida, faz o hash dela
        if (senha && senha.trim() !== '') {
            dataToUpdate.senha_hash = await bcryptjs_1.default.hash(senha, 10);
        }
        const updatedUser = await prisma_1.prisma.usuario.update({
            where: { id_usuario: parseInt(id, 10) },
            data: dataToUpdate
        });
        res.status(200).json(updatedUser);
    }
    catch (error) {
        console.error(`Erro ao atualizar utilizador ${req.params.id}:`, error);
        res.status(500).json({ message: "Erro ao atualizar utilizador." });
    }
};
exports.updateUser = updateUser;
