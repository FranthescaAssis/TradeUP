import * as cidadeRepository from "../repositories/cidade.repository.js";

export async function getCidadesByEstado(req, res, next) {
  try {
    const estadoId = Number(req.params.estadoId);
    return res.json(await cidadeRepository.getCidadesByEstado(estadoId));
  } catch (err) {
    return next(err);
  }
}
