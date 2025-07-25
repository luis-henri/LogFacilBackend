import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response): Promise<void> => {
    console.log('[AUTH] Pedido de registro recebido.');
    const { nome, email, cpf, password } = req.body;

    if (!nome || !email || !cpf || !password) {
        console.log('[AUTH] Falha na validação: Campos em falta.');
        res.status(400).json({ message: "Todos os campos são obrigatórios." });
        return;
    }

    try {
        console.log('[AUTH] A encriptar a senha...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('[AUTH] Senha encriptada com sucesso.');

        console.log('[AUTH] A tentar criar o novo usuário no banco de dados...');
        const newUser = await prisma.usuario.create({
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
    } catch (error) {
        console.error("[AUTH] Erro catastrófico durante o registro:", error);
        res.status(500).json({ message: "Erro ao criar usuário. O email ou CPF pode já existir." });
    }
};

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