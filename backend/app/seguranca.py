"""Senha (bcrypt) e token de login (JWT)."""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import JWT_SECRET, TOKEN_MINUTOS


def gerar_hash(senha: str) -> str:
    """Transforma a senha em um hash bcrypt. É isso que vai para o banco, nunca a senha."""
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def senha_confere(senha: str, hash_salvo: str) -> bool:
    try:
        return bcrypt.checkpw(senha.encode("utf-8"), hash_salvo.encode("utf-8"))
    except ValueError:  # senha acima do limite de 72 bytes do bcrypt
        return False


def criar_token(id_usuario: int) -> str:
    """Token assinado com o segredo do servidor; guarda o id do usuário e a hora em que vence."""
    vence = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_MINUTOS)
    return jwt.encode({"sub": str(id_usuario), "exp": vence}, JWT_SECRET, algorithm="HS256")


def ler_token(token: str) -> int | None:
    """Devolve o id do usuário, ou None se o token for falso, adulterado ou estiver vencido."""
    try:
        dados = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], options={"require": ["sub", "exp"]})
        return int(dados["sub"])
    except (jwt.InvalidTokenError, ValueError):
        return None
