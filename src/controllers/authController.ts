import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
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
    if (!user || !(await bcrypt.compare(password.trim(), user.senha_hash))) {
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

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
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

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};