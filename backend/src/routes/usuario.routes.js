import { Router } from 'express';
import * as usuarioController from "../controllers/usuario.controller.js";

export const usuarioRoutes = Router();

// GEt /api/usuarios
usuarioRoutes.get('/', usuarioController.getAllUsuarios);

// POST /api/usuarios — cadastro de conta
usuarioRoutes.post('/', usuarioController.registerUsuario);
