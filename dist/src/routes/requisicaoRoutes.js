"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requisicaoController_1 = require("../controllers/requisicaoController");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
// ==================================================================================
// ORDEM CORRIGIDA E FINAL: As rotas mais específicas vêm primeiro.
// ==================================================================================
// Rotas com palavras-chave específicas
router.get('/monitoramento', requisicaoController_1.getMonitoramentoRequisicoes);
router.get('/tipos-envio', requisicaoController_1.getTiposEnvio);
router.get('/status/:status', requisicaoController_1.getRequisicoesPorStatus);
// Rota para importar (método POST)
router.post('/importar', upload.single('file'), requisicaoController_1.importFromTxt);
// Rota raiz (GET para todas as requisições)
router.get('/', requisicaoController_1.getAllRequisicoes);
// Rota genérica com parâmetro :id (deve vir DEPOIS das outras rotas GET)
router.get('/:id', requisicaoController_1.getRequisicaoById);
// Rotas de atualização (método PATCH)
router.patch('/:id/prioridade', requisicaoController_1.togglePrioridade);
router.patch('/:id', requisicaoController_1.updateRequisicao);
exports.default = router;
