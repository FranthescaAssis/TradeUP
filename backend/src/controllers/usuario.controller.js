import * as usuarioRepository from "../repositories/usuario.repository.js";
import * as usuarioService from "../services/usuario.service.js";

export async function getAllUsuarios(req, res, next) {
  try {
    return res.json(await usuarioRepository.getAllUsuarios());
  } catch (err) {
    return next(err);
  }
}

export async function registerUsuario(req, res, next) {
  try {
    const result = await usuarioService.registerUsuario(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}
