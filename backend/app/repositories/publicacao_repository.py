"""SQL da tabela publicacao. Aqui só se fala com o banco: nenhuma regra de negócio."""

# Publicação e dados públicos do autor (nome e cidade). 
SELECT = """
    SELECT p.id_publicacao, p.titulo, p.descricao, p.categoria, p.tipo, p.modalidade, p.contrapartida, p.status, p.data_criacao,
           u.id_usuario, u.nome, u.cidade, u.estado
    FROM publicacao p JOIN usuario u ON u.id_usuario = p.id_usuario
"""

# A publicação continua com status 'ativa' mesmo depois de uma proposta ser aceita:
# ela só deixa de estar disponível por existir uma proposta 'aceita' para ela.
SEM_PROPOSTA_ACEITA = (
    "NOT EXISTS (SELECT 1 FROM proposta pr WHERE pr.id_publicacao = p.id_publicacao AND pr.status = 'aceita')"
)


def inserir(conn, id_usuario, titulo, descricao, categoria, tipo, modalidade, contrapartida) -> int:
    return conn.execute(
        "INSERT INTO publicacao (id_usuario, titulo, descricao, categoria, tipo, modalidade, contrapartida) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id_publicacao",
        (id_usuario, titulo, descricao, categoria, tipo, modalidade, contrapartida),
    ).fetchone()["id_publicacao"]


def buscar_por_id(conn, id_publicacao) -> dict | None:
    return conn.execute(SELECT + "WHERE p.id_publicacao = %s", (id_publicacao,)).fetchone()


def tem_proposta_aceita(conn, id_publicacao) -> bool:
    return conn.execute(
        "SELECT 1 FROM proposta WHERE id_publicacao = %s AND status = 'aceita'", (id_publicacao,)
    ).fetchone() is not None


def listar_ativas(conn) -> list[dict]:
    """Só as disponíveis (ativas e sem proposta aceita), da mais recente para a mais antiga (máximo de 200)."""
    return conn.execute(SELECT + f"WHERE p.status = 'ativa' AND {SEM_PROPOSTA_ACEITA} ORDER BY p.data_criacao DESC, p.id_publicacao DESC LIMIT 200").fetchall()


def listar_do_usuario(conn, id_usuario) -> list[dict]:
    """Todas as publicações do usuário (em qualquer status), da mais recente para a mais antiga."""
    return conn.execute(
        SELECT.replace("u.estado", f"u.estado, (NOT {SEM_PROPOSTA_ACEITA}) AS tem_aceita")
        + "WHERE p.id_usuario = %s ORDER BY p.data_criacao DESC, p.id_publicacao DESC",
        (id_usuario,),
    ).fetchall()


def travar(conn, id_publicacao) -> dict | None:
    """Trava a linha (FOR UPDATE): um aceite ou uma proposta nova em andamento termina antes do cancelamento."""
    return conn.execute(
        "SELECT id_publicacao, id_usuario, status FROM publicacao WHERE id_publicacao = %s FOR UPDATE",
        (id_publicacao,),
    ).fetchone()


def cancelar(conn, id_publicacao) -> None:
    """Cancela a publicação e as propostas que ainda estavam pendentes nela (as demais não mudam)."""
    conn.execute("UPDATE publicacao SET status = 'cancelada' WHERE id_publicacao = %s", (id_publicacao,))
    conn.execute(
        "UPDATE proposta SET status = 'cancelada' WHERE id_publicacao = %s AND status = 'pendente'",
        (id_publicacao,),
    )
