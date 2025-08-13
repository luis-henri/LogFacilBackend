import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        perfilId: number;
        perfilNome: string;
      };
    }
  }
}

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Não autorizado, token não fornecido.' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    req.user = {
      userId: decoded.userId,
      perfilId: decoded.perfilId,
      perfilNome: decoded.perfilNome
    };

    next();
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

// Novo middleware para verificar perfil
export const checkPerfil = (perfisPermitidos: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
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