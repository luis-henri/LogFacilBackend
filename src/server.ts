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

const allowedOrigins = [
    'https://logfacil.netlify.app', // <-- SUBSTITUA PELO URL DO SEU SITE NO NETLIFY
    'http://localhost:5173' // Mantemos o localhost para continuar a poder testar localmente
];

const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // Permite pedidos sem 'origin' (ex: Postman, apps móveis) ou que estejam na nossa lista
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Não permitido pela política de CORS'));
        }
    }
};

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
