"""Regras de cadastro, login e identificação do usuário pelo token."""
import psycopg
from fastapi import HTTPException

from app.repositories import usuario_repository
from app.schemas.auth import CadastroIn, LoginIn, PerfilIn
from app.seguranca import criar_token, gerar_hash, ler_token, senha_confere
from app.services.localidades_service import validar_cidade_estado


def dados_publicos(u: dict, habilidades: dict | None = None) -> dict:
    """Só o que pode ser mostrado ao usuário. A senha (nem o hash) NUNCA sai daqui."""
    habilidades = habilidades or {}
    return {
        "id": u["id_usuario"],
        "nome": u["nome"],
        "email": u["email"],
        "descricao": u["descricao"],
        "cidade": u["cidade"],
        "estado": u["estado"],
        "oferece": habilidades.get("oferece", []),
        "procura": habilidades.get("procura", []),
        "data_cadastro": u["data_cadastro"].isoformat() + "Z",
    }


def dados_do_usuario(conn, u: dict) -> dict:
    """dados_publicos com as habilidades que o usuário tem salvas."""
    return dados_publicos(u, usuario_repository.listar_habilidades(conn, u["id_usuario"]))


def resposta_com_token(conn, u: dict) -> dict:
    return {"access_token": criar_token(u["id_usuario"]), "token_type": "bearer", "usuario": dados_do_usuario(conn, u)}


def cadastrar(conn, dados: CadastroIn) -> dict:
    dados.cidade = validar_cidade_estado(dados.cidade, dados.estado)
    try:
        usuario = usuario_repository.inserir(conn, dados.nome, dados.email, gerar_hash(dados.senha), dados.cidade, dados.estado)
    except psycopg.errors.UniqueViolation:  # a coluna email é UNIQUE no banco: é ele quem garante que não repete
        mensagem = "Este e-mail já está cadastrado."
        raise HTTPException(409, {"mensagem": mensagem, "erros": {"email": mensagem}}) from None
    return resposta_com_token(conn, usuario)


def entrar(conn, dados: LoginIn) -> dict:
    usuario = usuario_repository.buscar_por_email(conn, dados.email)
    # Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails estão cadastrados.
    if usuario is None or not senha_confere(dados.senha, usuario["senha"]):
        raise HTTPException(401, "E-mail ou senha incorretos.")
    if usuario["status"] != 1:
        raise HTTPException(403, "Esta conta está bloqueada. Entre em contato com o suporte.")
    return resposta_com_token(conn, usuario)


def usuario_do_token(conn, token: str) -> dict:
    """Devolve o usuário dono do token, ou erro 401 se o token for inválido, vencido ou o usuário estiver bloqueado."""
    id_usuario = ler_token(token)
    usuario = usuario_repository.buscar_por_id(conn, id_usuario) if id_usuario else None
    if usuario is None or usuario["status"] != 1:
        raise HTTPException(401, "Sua sessão expirou ou é inválida. Entre novamente.")
    return usuario


def atualizar_perfil(conn, usuario: dict, dados: PerfilIn) -> dict:
    """Altera o perfil do próprio usuário: o id vem do token, nunca do corpo da requisição."""
    cidade = validar_cidade_estado(dados.cidade, dados.estado)
    atualizado = usuario_repository.atualizar_perfil(conn, usuario["id_usuario"], dados.nome, cidade, dados.estado, dados.descricao)
    # Só mexe na lista que foi enviada; tudo acontece na transação da requisição (erro = nada é salvo).
    for tipo in ("oferece", "procura"):
        nomes = getattr(dados, tipo)
        if nomes is not None:
            usuario_repository.salvar_habilidades(conn, usuario["id_usuario"], tipo, nomes)
    return dados_do_usuario(conn, atualizado)
