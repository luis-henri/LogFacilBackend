import { Router } from 'express';
import { protect, checkPerfil } from '../middleware/authMiddleware'; // <-- CORREÇÃO APLICADA AQUI
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

router.use(protect);

router.post(
    '/importar', 
    checkPerfil(['Administrador - Geral', 'ALMOX - Atendimento']), 
    upload.single('file'), 
    importFromTxt
);

router.get(
    '/', 
    checkPerfil(['Administrador - Geral', 'ALMOX - Atendimento']),
    getAllRequisicoes
);

router.get('/status/:status', getRequisicoesPorStatus);
router.get('/monitoramento', getMonitoramentoRequisicoes);
router.get('/tipos-envio', getTiposEnvio);
router.get('/:id', getRequisicaoById);
router.patch('/:id/prioridade', togglePrioridade);
router.patch('/:id', updateRequisicao);

export default router;