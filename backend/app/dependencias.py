"""Dependência que protege as rotas: exige login (JWT)."""
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.banco import get_conn
from app.services import auth_service

bearer = HTTPBearer(auto_error=False)


def usuario_logado(cred: HTTPAuthorizationCredentials | None = Depends(bearer), conn=Depends(get_conn)) -> dict:
    """Protege rotas: exige 'Authorization: Bearer <token>' válido e devolve o usuário DONO do token."""
    if cred is None:
        raise HTTPException(401, "Você precisa entrar na sua conta para continuar.")
    return auth_service.usuario_do_token(conn, cred.credentials)
