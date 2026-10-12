"""Rota que lista as cidades de um estado."""
from fastapi import APIRouter

from app.services import localidades_service

router = APIRouter(prefix="/localidades", tags=["Localidades"])


@router.get("/{uf}/cidades")
def listar_cidades(uf: str):
    return localidades_service.buscar_cidades(uf)
