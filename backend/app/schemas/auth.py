"""Esquemas (dados de entrada) do cadastro e do login."""
from pydantic import BaseModel, Field, ValidationInfo, field_validator

from app.schemas.comum import PADRAO_CIDADE, UFS, compactar, validar_email


class PerfilBase(BaseModel):
    """Campos e regras compartilhados pelo cadastro e pela edição de perfil."""
    nome: str
    cidade: str
    estado: str

    @field_validator("nome")
    @classmethod
    def conferir_nome(cls, valor):
        nome = compactar(valor)
        if not nome:
            raise ValueError("Informe seu nome.")
        if not any(c.isalpha() for c in nome) or not nome.isprintable():
            raise ValueError("O nome deve conter letras.")
        if len(nome) < 2:
            raise ValueError("O nome deve ter pelo menos 2 caracteres.")
        if len(nome) > 100:
            raise ValueError("O nome pode ter no máximo 100 caracteres.")
        return nome

    @field_validator("cidade")
    @classmethod
    def conferir_cidade(cls, valor):
        cidade = compactar(valor)
        if not cidade:
            raise ValueError("Informe sua cidade.")
        if len(cidade) < 2:
            raise ValueError("A cidade deve ter pelo menos 2 caracteres.")
        if len(cidade) > 100:
            raise ValueError("A cidade pode ter no máximo 100 caracteres.")
        if not PADRAO_CIDADE.match(cidade):
            raise ValueError("A cidade deve conter apenas letras, espaços e hífens.")
        return cidade

    @field_validator("estado")
    @classmethod
    def conferir_estado(cls, valor):
        uf = valor.strip().upper()
        if not uf:
            raise ValueError("Informe o estado (UF).")
        if uf not in UFS:
            raise ValueError("UF inválida. Use a sigla do estado, como GO ou SP.")
        return uf


MAX_HABILIDADES = 6
MAX_CARACTERES_HABILIDADE = 30


def limpar_habilidades(valores: list[str] | None) -> list[str] | None:
    """Aplica as regras das listas de habilidades. None (campo não enviado) significa "não mexer"."""
    if valores is None:
        return None
    limpas, vistas = [], set()
    for valor in valores:
        habilidade = compactar(valor)
        if not habilidade:
            raise ValueError("A habilidade não pode ficar em branco.")
        if len(habilidade) > MAX_CARACTERES_HABILIDADE:
            raise ValueError(f"Cada habilidade pode ter no máximo {MAX_CARACTERES_HABILIDADE} caracteres.")
        if habilidade.lower() not in vistas:  # repetida (ignorando maiúsculas e espaços) é descartada
            vistas.add(habilidade.lower())
            limpas.append(habilidade)
    if len(limpas) > MAX_HABILIDADES:
        raise ValueError(f"Informe no máximo {MAX_HABILIDADES} habilidades por lista.")
    return limpas


class PerfilIn(PerfilBase):
    """Edição do próprio perfil: e-mail e senha não mudam por aqui."""
    descricao: str | None = None
    # Listas de nomes de habilidades. Se um campo não vier, as habilidades salvas daquele tipo ficam como estão.
    oferece: list[str] | None = None
    procura: list[str] | None = None

    @field_validator("oferece", "procura")
    @classmethod
    def conferir_habilidades(cls, valor):
        return limpar_habilidades(valor)

    @field_validator("descricao")
    @classmethod
    def conferir_descricao(cls, valor):
        if valor is None:
            return None
        descricao = valor.strip()
        if len(descricao) > 200:
            raise ValueError("A descrição pode ter no máximo 200 caracteres.")
        return descricao or None  # vazia vira "sem descrição"


class CadastroIn(PerfilBase):
    email: str
    senha: str
    confirmacao_senha: str

    @field_validator("email")
    @classmethod
    def conferir_email(cls, valor):
        return validar_email(valor)

    @field_validator("senha")
    @classmethod
    def conferir_senha(cls, valor):  # a senha não é "aparada": espaços fazem parte dela
        if not valor:
            raise ValueError("Crie uma senha.")
        if len(valor) < 8:
            raise ValueError("A senha deve ter pelo menos 8 caracteres.")
        if len(valor.encode("utf-8")) > 72:  # limite do bcrypt
            raise ValueError("A senha é longa demais (máximo de 72 bytes, cerca de 72 letras).")
        if not any(c.isalpha() for c in valor) or not any(c.isdigit() for c in valor):
            raise ValueError("A senha deve ter letras e números.")
        return valor

    @field_validator("confirmacao_senha")
    @classmethod
    def conferir_confirmacao(cls, valor, info: ValidationInfo):
        if not valor:
            raise ValueError("Repita a senha para confirmar.")
        senha = info.data.get("senha")  # não existe se a senha já foi recusada acima
        if senha is not None and valor != senha:
            raise ValueError("As senhas precisam ser iguais.")
        return valor


class LoginIn(BaseModel):
    email: str
    senha: str = Field(max_length=256)

    @field_validator("email")
    @classmethod
    def conferir_email(cls, valor):
        return validar_email(valor, checar_tamanho=False)

    @field_validator("senha")
    @classmethod
    def conferir_senha(cls, valor):
        if not valor:
            raise ValueError("Informe sua senha.")
        return valor
