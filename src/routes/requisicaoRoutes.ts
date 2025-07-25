import { Router } from 'express';
import { 
    getAllRequisicoes, 
    togglePrioridade, 
    getRequisicaoById,
    importFromTxt,
    getRequisicoesPorStatus,
    updateRequisicao,
    getMonitoramentoRequisicoes,
    getTiposEnvio
} from '../controllers/requisicaoController';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// ==================================================================================
// ORDEM CORRIGIDA E FINAL: As rotas mais específicas vêm primeiro.
// ==================================================================================

// Rotas com palavras-chave específicas
router.get('/monitoramento', getMonitoramentoRequisicoes);
router.get('/tipos-envio', getTiposEnvio);
router.get('/status/:status', getRequisicoesPorStatus);

// Rota para importar (método POST)
router.post('/importar', upload.single('file'), importFromTxt);

// Rota raiz (GET para todas as requisições)
router.get('/', getAllRequisicoes);

// Rota genérica com parâmetro :id (deve vir DEPOIS das outras rotas GET)
router.get('/:id', getRequisicaoById);

// Rotas de atualização (método PATCH)
router.patch('/:id/prioridade', togglePrioridade);
router.patch('/:id', updateRequisicao);


export default router;