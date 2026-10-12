"""SQL da tabela usuario"""

COLUNAS = "id_usuario, nome, email, descricao, cidade, estado, data_cadastro, status"


def inserir(conn, nome, email, senha_hash, cidade, estado) -> dict:
    return conn.execute(
        f"INSERT INTO usuario (nome, email, senha, cidade, estado) VALUES (%s, %s, %s, %s, %s) RETURNING {COLUNAS}",
        (nome, email, senha_hash, cidade, estado),
    ).fetchone()


def buscar_por_email(conn, email) -> dict | None:
    """Traz também a coluna senha (o hash), necessária para conferir o login."""
    return conn.execute(f"SELECT {COLUNAS}, senha FROM usuario WHERE email = %s", (email,)).fetchone()


def buscar_por_id(conn, id_usuario) -> dict | None:
    return conn.execute(f"SELECT {COLUNAS} FROM usuario WHERE id_usuario = %s", (id_usuario,)).fetchone()


def atualizar_perfil(conn, id_usuario, nome, cidade, estado, descricao) -> dict:
    """Só nome, cidade, estado e descrição mudam; e-mail, senha e status ficam como estão."""
    return conn.execute(
        f"UPDATE usuario SET nome = %s, cidade = %s, estado = %s, descricao = %s WHERE id_usuario = %s RETURNING {COLUNAS}",
        (nome, cidade, estado, descricao, id_usuario),
    ).fetchone()


def listar_habilidades(conn, id_usuario) -> dict:
    """Nomes das habilidades do usuário, separados em "oferece" e "procura" (na ordem em que foram salvos)."""
    linhas = conn.execute(
        "SELECT uh.tipo, h.nome FROM usuario_habilidade uh JOIN habilidade h USING (id_habilidade) "
        "WHERE uh.id_usuario = %s ORDER BY uh.data_cadastro, h.id_habilidade",
        (id_usuario,),
    ).fetchall()
    return {tipo: [l["nome"] for l in linhas if l["tipo"] == tipo] for tipo in ("oferece", "procura")}


def _id_habilidade(conn, nome) -> int:
    """Acha a habilidade pelo nome (sem diferenciar maiúsculas) ou cria. Chamar só com o bloqueio de salvar_habilidades."""
    achada = conn.execute("SELECT id_habilidade FROM habilidade WHERE lower(nome) = lower(%s) ORDER BY id_habilidade LIMIT 1", (nome,)).fetchone()
    if achada:
        return achada["id_habilidade"]
    return conn.execute("INSERT INTO habilidade (nome) VALUES (%s) RETURNING id_habilidade", (nome,)).fetchone()["id_habilidade"]


def salvar_habilidades(conn, id_usuario, tipo, nomes) -> None:
    """Troca a lista de um tipo ("oferece" ou "procura") do usuário pela nova. Na mesma transação do perfil."""
    # A tabela habilidade não tem UNIQUE no nome; este bloqueio (liberado no commit/rollback) faz duas requisições
    # simultâneas com a mesma habilidade nova se enfileirarem em vez de criarem duas linhas iguais.
    conn.execute("SELECT pg_advisory_xact_lock(hashtext('usuario_habilidade'))")
    conn.execute("DELETE FROM usuario_habilidade WHERE id_usuario = %s AND tipo = %s", (id_usuario, tipo))
    for nome in nomes:
        conn.execute(
            "INSERT INTO usuario_habilidade (id_usuario, id_habilidade, tipo) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
            (id_usuario, _id_habilidade(conn, nome), tipo),
        )
