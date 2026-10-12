"""Rotas de cadastro, login e "quem sou eu"."""
from fastapi import APIRouter, Depends

from app.banco import get_conn
from app.dependencias import usuario_logado
from app.schemas.auth import CadastroIn, LoginIn, PerfilIn
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/register", status_code=201)
def cadastrar(dados: CadastroIn, conn=Depends(get_conn)):
    return auth_service.cadastrar(conn, dados)


@router.post("/login")
def entrar(dados: LoginIn, conn=Depends(get_conn)):
    return auth_service.entrar(conn, dados)


@router.get("/me")
def quem_sou_eu(usuario: dict = Depends(usuario_logado), conn=Depends(get_conn)):
    return auth_service.dados_do_usuario(conn, usuario)


@router.patch("/me")
def atualizar_perfil(dados: PerfilIn, usuario: dict = Depends(usuario_logado), conn=Depends(get_conn)):
    return auth_service.atualizar_perfil(conn, usuario, dados)
