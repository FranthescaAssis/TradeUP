"""Esquema (dados de entrada) de uma publicação."""
from typing import Literal

from pydantic import BaseModel, Field, ValidationInfo, field_validator

from app.schemas.comum import compactar


CATEGORIAS = ["Tecnologia", "Idiomas", "Artes", "Design", "Marketing", "Bem-estar"]


class PublicacaoIn(BaseModel):
    titulo: str
    descricao: str
    categoria: str
    tipo: Literal["oferta", "necessidade"]
    modalidade: Literal["online", "presencial", "ambos"]
    # O que o autor oferece em troca: obrigatório só em solicitações (na oferta, o próprio anúncio é a contrapartida).
    contrapartida: str | None = Field(default=None, validate_default=True)

    @field_validator("titulo")
    @classmethod
    def conferir_titulo(cls, valor):
        titulo = compactar(valor)
        if len(titulo) < 5:
            raise ValueError("O título deve ter pelo menos 5 caracteres.")
        if len(titulo) > 150:
            raise ValueError("O título pode ter no máximo 150 caracteres.")
        return titulo

    @field_validator("descricao")
    @classmethod
    def conferir_descricao(cls, valor):
        descricao = valor.strip()
        if len(descricao) < 10:
            raise ValueError("A descrição deve ter pelo menos 10 caracteres.")
        if len(descricao) > 2000:
            raise ValueError("A descrição pode ter no máximo 2000 caracteres.")
        return descricao

    @field_validator("categoria")
    @classmethod
    def conferir_categoria(cls, valor):
        if valor not in CATEGORIAS:
            raise ValueError("Escolha uma categoria da lista.")
        return valor

    # tipo é validado antes (vem antes na classe), então já está em info.data.
    @field_validator("contrapartida")
    @classmethod
    def conferir_contrapartida(cls, valor, info: ValidationInfo):
        if info.data.get("tipo") != "necessidade":
            return None  # oferta: não há contrapartida a registrar
        contrapartida = compactar(valor or "")
        if len(contrapartida) < 3:
            raise ValueError("Descreva o que você oferece em troca (mínimo de 3 caracteres).")
        if len(contrapartida) > 500:
            raise ValueError("O que você oferece em troca pode ter no máximo 500 caracteres.")
        return contrapartida


class StatusPublicacaoIn(BaseModel):
    """Por enquanto a única mudança permitida é cancelar a própria publicação."""
    status: Literal["cancelada"]
