"""SQL da tabela proposta. Aqui só se fala com o banco: nenhuma regra de negócio."""

# Proposta + dados da publicação + dados públicos de quem propôs e do dono da publicação. Nunca e-mail nem senha.
SELECT = """
    SELECT pr.id_proposta, pr.status, pr.oferta, pr.mensagem, pr.tipo_data, pr.data_troca, pr.data_fim, pr.data_proposta,
           pub.id_publicacao, pub.titulo, pub.descricao, pub.tipo, pub.categoria, pub.modalidade, pub.contrapartida,
           pub.id_usuario AS id_dono, dono.nome AS nome_dono, dono.cidade AS cidade_dono, dono.estado AS estado_dono,
           pr.id_usuario AS id_proponente, prop.nome AS nome_proponente, prop.cidade AS cidade_proponente,
           prop.estado AS estado_proponente
    FROM proposta pr
    JOIN publicacao pub ON pub.id_publicacao = pr.id_publicacao
    JOIN usuario dono ON dono.id_usuario = pub.id_usuario
    JOIN usuario prop ON prop.id_usuario = pr.id_usuario
"""
ORDEM = " ORDER BY pr.data_proposta DESC, pr.id_proposta DESC"


def inserir(conn, id_publicacao, id_usuario, oferta, mensagem, tipo_data, data_troca, data_fim) -> int:
    return conn.execute(
        "INSERT INTO proposta (id_publicacao, id_usuario, oferta, mensagem, tipo_data, data_troca, data_fim) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id_proposta",
        (id_publicacao, id_usuario, oferta, mensagem, tipo_data, data_troca, data_fim),
    ).fetchone()["id_proposta"]


def buscar_por_id(conn, id_proposta) -> dict | None:
    return conn.execute(SELECT + "WHERE pr.id_proposta = %s", (id_proposta,)).fetchone()


def listar_enviadas(conn, id_usuario) -> list[dict]:
    """Propostas que o usuário enviou, da mais recente para a mais antiga."""
    return conn.execute(SELECT + "WHERE pr.id_usuario = %s" + ORDEM, (id_usuario,)).fetchall()


def listar_recebidas(conn, id_usuario) -> list[dict]:
    """Propostas feitas às publicações do usuário, da mais recente para a mais antiga."""
    return conn.execute(SELECT + "WHERE pub.id_usuario = %s" + ORDEM, (id_usuario,)).fetchall()


def travar_publicacao(conn, id_publicacao) -> dict | None:
    """Trava a linha da publicação até o fim da transação (FOR UPDATE).
    Quem chegar depois (outro aceite, outra proposta) espera aqui, e assim as decisões não se atropelam."""
    return conn.execute(
        "SELECT id_publicacao, id_usuario, status, tipo, contrapartida FROM publicacao WHERE id_publicacao = %s FOR UPDATE",
        (id_publicacao,),
    ).fetchone()


def publicacao_tem_aceita(conn, id_publicacao) -> bool:
    return conn.execute(
        "SELECT 1 FROM proposta WHERE id_publicacao = %s AND status = 'aceita'", (id_publicacao,)
    ).fetchone() is not None


def atualizar_status(conn, id_proposta, status) -> None:
    conn.execute("UPDATE proposta SET status = %s WHERE id_proposta = %s", (status, id_proposta))


def concluir_publicacao(conn, id_publicacao) -> None:
    """Ao concluir a troca, a publicação também sai de circulação (não volta a ficar disponível)."""
    conn.execute("UPDATE publicacao SET status = 'concluida' WHERE id_publicacao = %s", (id_publicacao,))


def recusar_pendentes(conn, id_publicacao, exceto_id_proposta) -> None:
    """Ao aceitar uma proposta, todas as outras pendentes da mesma publicação são recusadas."""
    conn.execute(
        "UPDATE proposta SET status = 'recusada' "
        "WHERE id_publicacao = %s AND status = 'pendente' AND id_proposta <> %s",
        (id_publicacao, exceto_id_proposta),
    )
