"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const requisicaoRoutes_1 = __importDefault(require("./routes/requisicaoRoutes"));
const authMiddleware_1 = require("./middleware/authMiddleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// =============================================================================
// MIDDLEWARE DE LOG DE DEPURAÇÃO
// Este código irá correr para CADA pedido que chegar ao seu backend.
// =============================================================================
app.use((req, res, next) => {
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
app.use('/api/auth', authRoutes_1.default);
app.use('/api/requisicoes', authMiddleware_1.protect, requisicaoRoutes_1.default);
app.listen(port, () => {
    console.log(`Backend a correr em http://localhost:${port}`);
});
