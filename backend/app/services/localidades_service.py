"""Lista de municípios por estado (arquivo local do IBGE) e conferência da cidade escolhida no cadastro."""
import json
from functools import lru_cache
from pathlib import Path

from fastapi import HTTPException

from app.schemas.comum import UFS

ARQUIVO = Path(__file__).resolve().parents[1] / "data" / "municipios.json"


@lru_cache(maxsize=1)
def _carregar() -> dict[str, list[str]]:
    return json.loads(ARQUIVO.read_text(encoding="utf-8"))


def buscar_cidades(uf: str) -> list[str]:
    uf = uf.strip().upper()
    if uf not in UFS:
        raise HTTPException(422, {"mensagem": "Estado inválido.", "erros": {"estado": "Selecione um estado válido."}})
    return list(_carregar()[uf])


def validar_cidade_estado(cidade: str, uf: str) -> str:
    for nome in buscar_cidades(uf):
        if nome.casefold() == cidade.casefold():
            return nome  # Salva o nome oficial do município.
    mensagem = "Selecione uma cidade pertencente ao estado informado."
    raise HTTPException(422, {"mensagem": mensagem, "erros": {"cidade": mensagem}})
