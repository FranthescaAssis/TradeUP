"""Regras das propostas de troca."""
import psycopg
from fastapi import HTTPException

from app.repositories import proposta_repository as repo
from app.schemas.proposta import PropostaIn, RespostaIn


def _pessoa(p: dict, sufixo: str) -> dict:
    return {"id": p[f"id_{sufixo}"], "nome": p[f"nome_{sufixo}"], "cidade": p[f"cidade_{sufixo}"], "estado": p[f"estado_{sufixo}"]}


def dados_proposta(p: dict) -> dict:
    """Só o que pode ser mostrado: nada de e-mail ou senha de ninguém."""
    return {
        "id": p["id_proposta"],
        "status": p["status"],
        "oferta": p["oferta"],
        "mensagem": p["mensagem"],
        "tipo_data": p["tipo_data"],
        "data_troca": p["data_troca"].isoformat() if p["data_troca"] else None,
        "data_fim": p["data_fim"].isoformat() if p["data_fim"] else None,
        "data_proposta": p["data_proposta"].isoformat() + "Z",
        "publicacao": {
            "id": p["id_publicacao"], "titulo": p["titulo"], "descricao": p["descricao"], "tipo": p["tipo"],
            "categoria": p["categoria"], "modalidade": p["modalidade"], "contrapartida": p["contrapartida"],
        },
        "proponente": _pessoa(p, "proponente"),  # quem enviou a proposta
        "dono": _pessoa(p, "dono"),  # dono da publicação (quem aceita ou recusa)
    }


def _nao_encontrada():
    return HTTPException(404, "Proposta não encontrada.")


def _vazio(texto) -> bool:
    return not texto or not texto.strip()


def criar(conn, usuario: dict, dados: PropostaIn) -> dict:
    # Trava a publicação: se o dono estiver aceitando outra proposta agora, esperamos ele terminar
    # e só então conferimos se a publicação ainda está disponível.
    publicacao = repo.travar_publicacao(conn, dados.id_publicacao)
    if publicacao is None:
        raise HTTPException(404, "Publicação não encontrada.")
    if publicacao["id_usuario"] == usuario["id_usuario"]:
        raise HTTPException(403, "Você não pode enviar proposta para a sua própria publicação.")
    if publicacao["status"] != "ativa" or repo.publicacao_tem_aceita(conn, dados.id_publicacao):
        raise HTTPException(409, "Esta publicação não está mais disponível para propostas.")
    if publicacao["tipo"] == "necessidade" and _vazio(publicacao["contrapartida"]):
        raise HTTPException(409, "O autor desta solicitação ainda não informou o que oferece em troca.")
    try:
        id_nova = repo.inserir(
            conn, dados.id_publicacao, usuario["id_usuario"], dados.oferta, dados.mensagem,
            dados.tipo_data, dados.data_troca, dados.data_fim,
        )
    except psycopg.errors.UniqueViolation:  # a regra "uma proposta por usuário e publicação" é garantida pelo banco
        raise HTTPException(409, "Você já enviou uma proposta para esta publicação.") from None
    return dados_proposta(repo.buscar_por_id(conn, id_nova))


def listar_enviadas(conn, usuario: dict) -> list[dict]:
    return [dados_proposta(p) for p in repo.listar_enviadas(conn, usuario["id_usuario"])]


def listar_recebidas(conn, usuario: dict) -> list[dict]:
    return [dados_proposta(p) for p in repo.listar_recebidas(conn, usuario["id_usuario"])]


def detalhar(conn, usuario: dict, id_proposta: int) -> dict:
    p = repo.buscar_por_id(conn, id_proposta)
    # Quem não participa recebe o mesmo "não encontrada": nem revelamos que a proposta existe.
    if p is None or usuario["id_usuario"] not in (p["id_dono"], p["id_proponente"]):
        raise _nao_encontrada()
    return dados_proposta(p)


def responder(conn, usuario: dict, id_proposta: int, dados: RespostaIn) -> dict:
    """O dono aceita ou recusa uma proposta pendente; qualquer participante conclui uma aceita. Tudo acontece numa única transação:
    o commit só ocorre no fim da requisição, e qualquer erro desfaz tudo (rollback)."""
    p = repo.buscar_por_id(conn, id_proposta)
    if p is None:
        raise _nao_encontrada()

    # 1) Trava a publicação. Dois cliques/aceites ao mesmo tempo entram "em fila" aqui.
    repo.travar_publicacao(conn, p["id_publicacao"])
    # 2) Relê a proposta já com a trava: outro aceite pode ter mudado o status enquanto esperávamos.
    p = repo.buscar_por_id(conn, id_proposta)

    if usuario["id_usuario"] not in (p["id_dono"], p["id_proponente"]):
        raise _nao_encontrada()
    if dados.status == "concluida":
        # Qualquer um dos dois participantes (já conferidos acima) conclui, mas só uma troca aceita.
        if p["status"] == "concluida":
            raise HTTPException(409, "Esta troca já foi concluída.")
        if p["status"] != "aceita":
            raise HTTPException(409, "Só é possível concluir uma troca que foi aceita.")
        repo.atualizar_status(conn, id_proposta, "concluida")
        repo.concluir_publicacao(conn, p["id_publicacao"])
        return dados_proposta(repo.buscar_por_id(conn, id_proposta))

    if usuario["id_usuario"] != p["id_dono"]:
        raise HTTPException(403, "Somente o dono da publicação pode aceitar ou recusar propostas.")
    if p["status"] != "pendente":
        raise HTTPException(409, "Esta proposta já foi respondida.")

    if dados.status == "aceita":
        # Cada lado precisa ter definido o que oferece: o proponente (oferta) e o dono (o anúncio, ou a contrapartida na solicitação).
        if _vazio(p["oferta"]):
            raise HTTPException(409, "Esta proposta não informa o que o proponente oferece em troca.")
        if p["tipo"] == "necessidade" and _vazio(p["contrapartida"]):
            raise HTTPException(409, "Esta solicitação não informa o que o autor oferece em troca.")
        if repo.publicacao_tem_aceita(conn, p["id_publicacao"]):
            raise HTTPException(409, "Esta publicação já tem uma proposta aceita.")
        repo.atualizar_status(conn, id_proposta, "aceita")
        repo.recusar_pendentes(conn, p["id_publicacao"], id_proposta)
    else:
        # Recusar uma só não afeta as outras: a publicação segue disponível para os demais interessados.
        repo.atualizar_status(conn, id_proposta, "recusada")

    return dados_proposta(repo.buscar_por_id(conn, id_proposta))
