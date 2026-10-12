"""Regras de publicações (ofertas e necessidades)."""
from fastapi import HTTPException

from app.repositories import publicacao_repository
from app.schemas.publicacao import PublicacaoIn, StatusPublicacaoIn


def dados_publicacao(p: dict, disponivel: bool = True) -> dict:
    return {
        "id": p["id_publicacao"],
        "titulo": p["titulo"],
        "descricao": p["descricao"],
        "categoria": p["categoria"],
        "tipo": p["tipo"],
        "modalidade": p["modalidade"],
        "contrapartida": p["contrapartida"],  # só nas solicitações; na oferta o anúncio é a contrapartida
        "status": p["status"],
        "disponivel": disponivel,  # false quando já existe uma proposta aceita (ou a publicação não está ativa)
        "data_criacao": p["data_criacao"].isoformat() + "Z",
        "autor": {"id": p["id_usuario"], "nome": p["nome"], "cidade": p["cidade"], "estado": p["estado"]},
    }


def criar(conn, usuario: dict, dados: PublicacaoIn) -> dict:
    # O dono vem do token (usuario), nunca do corpo da requisição.
    id_nova = publicacao_repository.inserir(
        conn, usuario["id_usuario"], dados.titulo, dados.descricao, dados.categoria, dados.tipo, dados.modalidade,
        dados.contrapartida,
    )
    return dados_publicacao(publicacao_repository.buscar_por_id(conn, id_nova))


def listar(conn) -> list[dict]:
    """Publicações ativas, da mais recente para a mais antiga. Os filtros ficam na tela Explorar."""
    return [dados_publicacao(p) for p in publicacao_repository.listar_ativas(conn)]


def buscar(conn, id_publicacao: int) -> dict:
    """Uma publicação pelo id (usada pela tela de proposta, que precisa funcionar também após recarregar)."""
    p = publicacao_repository.buscar_por_id(conn, id_publicacao)
    if p is None:
        raise HTTPException(404, "Publicação não encontrada.")
    disponivel = p["status"] == "ativa" and not publicacao_repository.tem_proposta_aceita(conn, id_publicacao)
    return dados_publicacao(p, disponivel)


def listar_minhas(conn, usuario: dict) -> list[dict]:
    """Publicações do próprio usuário, inclusive as canceladas e concluídas."""
    return [
        dados_publicacao(p, p["status"] == "ativa" and not p["tem_aceita"])
        for p in publicacao_repository.listar_do_usuario(conn, usuario["id_usuario"])
    ]


def cancelar(conn, usuario: dict, id_publicacao: int, dados: StatusPublicacaoIn) -> dict:
    """O dono cancela uma publicação ativa e sem proposta aceita. Publicação e propostas pendentes mudam na mesma
    transação (o commit só ocorre no fim da requisição; qualquer erro desfaz tudo)."""
    p = publicacao_repository.travar(conn, id_publicacao)
    if p is None:
        raise HTTPException(404, "Publicação não encontrada.")
    if p["id_usuario"] != usuario["id_usuario"]:
        raise HTTPException(403, "Você só pode cancelar as suas próprias publicações.")
    if p["status"] == "cancelada":
        raise HTTPException(409, "Esta publicação já foi cancelada.")
    if p["status"] == "concluida":
        raise HTTPException(409, "Esta publicação já teve a troca concluída e não pode ser cancelada.")
    if publicacao_repository.tem_proposta_aceita(conn, id_publicacao):
        raise HTTPException(409, "Esta publicação tem uma proposta aceita. Conclua a troca em vez de cancelar.")
    publicacao_repository.cancelar(conn, id_publicacao)
    return buscar(conn, id_publicacao)
