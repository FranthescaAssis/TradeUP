import * as estadoRepository from "../repositories/estado.repository.js";

export async function getAllEstados(req, res, next) {
  try {
    return res.json(await estadoRepository.getAllEstados());
  } catch (err) {
    return next(err);
  }
}
