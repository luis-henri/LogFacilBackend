import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Esta declaração global permite adicionar a propriedade 'user' ao objeto Request
declare global {
    namespace Express {
        interface Request {
            user?: { userId: number };
        }
    }
}

export const protect = (req: Request, res: Response, next: NextFunction): void => {
    // PONTO DE VERIFICAÇÃO: Vamos ver o que está a chegar no cabeçalho
    console.log('[AUTH MIDDLEWARE] Cabeçalho de Autorização Recebido:', req.headers.authorization);

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[AUTH MIDDLEWARE] Falha: Cabeçalho ausente ou não começa com "Bearer ".');
        res.status(401).json({ message: 'Não autorizado, token não fornecido.' });
        return;
    }

    try {
        const token = authHeader.split(' ')[1];
        
        if (!process.env.JWT_SECRET) {
            console.error('[AUTH MIDDLEWARE] Erro Crítico: JWT_SECRET não está configurado no servidor.');
            throw new Error('O segredo JWT não está configurado no servidor.');
        }

        // LINHA ADICIONADA PARA DEPURAÇÃO
        console.log('[AUTH MIDDLEWARE] Segredo usado para verificar o token:', process.env.JWT_SECRET);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = decoded as { userId: number };

        console.log('[AUTH MIDDLEWARE] Sucesso: Token verificado para o userId:', req.user.userId);
        next();
    } catch (error) {
        console.error('[AUTH MIDDLEWARE] Erro: Token inválido ou expirado.', error);
        res.status(401).json({ message: 'Token inválido ou expirado.' });
        return;
    }
};