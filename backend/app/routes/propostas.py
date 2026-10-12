"""Rotas de propostas de troca. Todas exigem login; o usuário sempre vem do token."""
from fastapi import APIRouter, Depends

from app.banco import get_conn
from app.dependencias import usuario_logado
from app.schemas.proposta import PropostaIn, RespostaIn
from app.services import propostas_service

router = APIRouter(prefix="/propostas", tags=["Propostas"])


@router.post("", status_code=201)
def enviar(dados: PropostaIn, usuario: dict = Depends(usuario_logado), conn=Depends(get_conn)):
    return propostas_service.criar(conn, usuario, dados)


# "enviadas" e "recebidas" precisam vir ANTES de "/{id_proposta}", senão o FastAPI as trataria como um id.
@router.get("/enviadas")
def enviadas(usuario: dict = Depends(usuario_logado), conn=Depends(get_conn)):
    return propostas_service.listar_enviadas(conn, usuario)


@router.get("/recebidas")
def recebidas(usuario: dict = Depends(usuario_logado), conn=Depends(get_conn)):
    return propostas_service.listar_recebidas(conn, usuario)


@router.get("/{id_proposta}")
def detalhes(id_proposta: int, usuario: dict = Depends(usuario_logado), conn=Depends(get_conn)):
    return propostas_service.detalhar(conn, usuario, id_proposta)


@router.patch("/{id_proposta}")
def responder(id_proposta: int, dados: RespostaIn, usuario: dict = Depends(usuario_logado), conn=Depends(get_conn)):
    """Aceitar ou recusar (só o dono da publicação)."""
    return propostas_service.responder(conn, usuario, id_proposta, dados)
