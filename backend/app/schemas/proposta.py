"""Esquemas (dados de entrada) de uma proposta de troca."""
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, ValidationInfo, field_validator

from app.schemas.comum import compactar


class PropostaIn(BaseModel):
    id_publicacao: int
    oferta: str  # "O que você oferece?"
    mensagem: str | None = None
    # As datas são apenas sugestões (não existe agendamento). Em "a_combinar" nenhuma data é necessária.
    tipo_data: Literal["unica", "periodo", "a_combinar"] = "a_combinar"
    data_troca: date | None = Field(default=None, validate_default=True)  # data única ou início do período
    data_fim: date | None = Field(default=None, validate_default=True)  # fim do período

    @field_validator("oferta")
    @classmethod
    def conferir_oferta(cls, valor):
        oferta = compactar(valor)
        if len(oferta) < 3:
            raise ValueError("Descreva o que você oferece (mínimo de 3 caracteres).")
        if len(oferta) > 500:
            raise ValueError("O que você oferece pode ter no máximo 500 caracteres.")
        return oferta

    @field_validator("mensagem")
    @classmethod
    def conferir_mensagem(cls, valor):
        if valor is None:
            return None
        mensagem = valor.strip()
        if len(mensagem) > 1000:
            raise ValueError("A mensagem pode ter no máximo 1000 caracteres.")
        return mensagem or None  # mensagem vazia vira "sem mensagem"

    # Os campos são validados na ordem em que aparecem na classe, então tipo_data já está em info.data.
    @field_validator("data_troca")
    @classmethod
    def conferir_data_troca(cls, valor, info: ValidationInfo):
        tipo = info.data.get("tipo_data")
        if tipo == "a_combinar":
            return None  # datas enviadas por engano são ignoradas
        if tipo in ("unica", "periodo"):
            if valor is None:
                raise ValueError("Informe a data." if tipo == "unica" else "Informe a data de início.")
            if valor < date.today():
                raise ValueError("A data não pode estar no passado.")
        return valor

    @field_validator("data_fim")
    @classmethod
    def conferir_data_fim(cls, valor, info: ValidationInfo):
        tipo = info.data.get("tipo_data")
        if tipo != "periodo":
            return None  # só o período tem data final
        if valor is None:
            raise ValueError("Informe a data final do período.")
        inicio = info.data.get("data_troca")  # não existe se a data de início já foi recusada acima
        if inicio is not None and valor < inicio:
            raise ValueError("A data final não pode ser anterior à data de início.")
        return valor


class RespostaIn(BaseModel):
    """O dono da publicação aceita ou recusa; qualquer participante conclui uma troca já aceita."""
    status: Literal["aceita", "recusada", "concluida"]
