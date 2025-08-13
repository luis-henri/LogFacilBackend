"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
router.get('/', userController_1.getAllUsers);
router.patch('/:id', userController_1.updateUser);
router.get('/perfis', userController_1.getAllPerfis);
exports.default = router;
