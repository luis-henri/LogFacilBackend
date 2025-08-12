import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response): Promise<void> => {
    const { cpf, password } = req.body;
    if (!cpf || !password) {
        res.status(400).json({ message: "CPF e senha são obrigatórios." });
        return;
    }
    try {
        const user = await prisma.usuario.findUnique({ where: { cpf_usuario: cpf } });
        if (!user || !(await bcrypt.compare(password, user.senha_hash))) {
            res.status(401).json({ message: 'CPF ou senha inválidos' });
            return;
        }
        if (!process.env.JWT_SECRET) {
            throw new Error('O segredo JWT não está definido.');
        }

        // LINHA ADICIONADA PARA DEPURAÇÃO
        console.log('[AUTH CONTROLLER] Segredo usado para criar o token:', process.env.JWT_SECRET);
        
        const token = jwt.sign({ userId: user.id_usuario, nome: user.nome_usuario }, process.env.JWT_SECRET, { expiresIn: '8h' });
        
        res.json({ 
            message: "Login bem-sucedido!", 
            token,
            user: {
                id: user.id_usuario,
                nome: user.nome_usuario,
                email: user.email_usuario
            }
        });
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};