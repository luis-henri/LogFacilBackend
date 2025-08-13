"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware"); // <-- CORREÇÃO APLICADA AQUI
const requisicaoController_1 = require("../controllers/requisicaoController");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect);
router.post('/importar', (0, authMiddleware_1.checkPerfil)(['Administrador - Geral', 'ALMOX - Atendimento']), upload.single('file'), requisicaoController_1.importFromTxt);
router.get('/', (0, authMiddleware_1.checkPerfil)(['Administrador - Geral', 'ALMOX - Atendimento']), requisicaoController_1.getAllRequisicoes);
router.get('/status/:status', requisicaoController_1.getRequisicoesPorStatus);
router.get('/monitoramento', requisicaoController_1.getMonitoramentoRequisicoes);
router.get('/tipos-envio', requisicaoController_1.getTiposEnvio);
router.get('/:id', requisicaoController_1.getRequisicaoById);
router.patch('/:id/prioridade', requisicaoController_1.togglePrioridade);
router.patch('/:id', requisicaoController_1.updateRequisicao);
exports.default = router;
