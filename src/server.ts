import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import requisicaoRoutes from './routes/requisicaoRoutes';
import userRoutes from './routes/userRoutes'
import { protect } from './middleware/authMiddleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =============================================================================
// MIDDLEWARE DE LOG DE DEPURAÇÃO
// Este código irá correr para CADA pedido que chegar ao seu backend.
// =============================================================================
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log('-----------------------------------------');
    console.log(`[DEBUG] Pedido recebido: ${req.method} ${req.originalUrl}`);
    console.log('[DEBUG] Corpo do Pedido (Body):', req.body);
    console.log('[DEBUG] Cabeçalhos (Headers):', req.headers.authorization || 'Sem token de autorização');
    console.log('-----------------------------------------');
    next(); // Passa o pedido para a próxima etapa (as suas rotas)
});


// Rota de "health check" para testar se o servidor está acessível
app.get('/', (req, res) => {
    res.send('Backend do LogFácil está a funcionar!');
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/requisicoes', protect, requisicaoRoutes);
app.use('/api/usuarios', protect, userRoutes);

app.listen(port, () => {
  console.log(`Backend a correr em http://localhost:${port}`);
});
