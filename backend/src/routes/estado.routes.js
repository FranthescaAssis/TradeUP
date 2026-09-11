import { Router } from 'express';
import * as estadoController from "../controllers/estado.controller.js";
import * as cidadeController from "../controllers/cidade.controller.js";

export const estadoRoutes = Router();

// GET /api/estados
estadoRoutes.get('/', estadoController.getAllEstados);

// GET /api/estados/:estadoId/cidades
estadoRoutes.get('/:estadoId/cidades', cidadeController.getCidadesByEstado);
