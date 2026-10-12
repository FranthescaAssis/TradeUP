"""Rotas de publicações (ofertas e necessidades). Todas exigem login."""
from fastapi import APIRouter, Depends

from app.banco import get_conn
from app.dependencias import usuario_logado
from app.schemas.publicacao import PublicacaoIn, StatusPublicacaoIn
from app.services import publicacoes_service

router = APIRouter(prefix="/publicacoes", tags=["Publicações"])


@router.post("", status_code=201)
def criar(dados: PublicacaoIn, usuario: dict = Depends(usuario_logado), conn=Depends(get_conn)):
    return publicacoes_service.criar(conn, usuario, dados)


@router.get("")
def listar(usuario: dict = Depends(usuario_logado), conn=Depends(get_conn)):
    return publicacoes_service.listar(conn)


# "minhas" precisa vir ANTES de "/{id_publicacao}", senão o FastAPI a trataria como um id.
@router.get("/minhas")
def minhas(usuario: dict = Depends(usuario_logado), conn=Depends(get_conn)):
    return publicacoes_service.listar_minhas(conn, usuario)


@router.get("/{id_publicacao}")
def buscar(id_publicacao: int, usuario: dict = Depends(usuario_logado), conn=Depends(get_conn)):
    return publicacoes_service.buscar(conn, id_publicacao)


@router.patch("/{id_publicacao}")
def cancelar(id_publicacao: int, dados: StatusPublicacaoIn, usuario: dict = Depends(usuario_logado), conn=Depends(get_conn)):
    """Cancelar a própria publicação (só o dono)."""
    return publicacoes_service.cancelar(conn, usuario, id_publicacao, dados)
