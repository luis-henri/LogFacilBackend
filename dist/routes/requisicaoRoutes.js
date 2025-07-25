"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requisicaoController_1 = require("../controllers/requisicaoController");
const router = (0, express_1.Router)();
// Esta rota agora será protegida pelo middleware no server.ts
router.get('/', requisicaoController_1.getAllRequisicoes);
exports.default = router;
