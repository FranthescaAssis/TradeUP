"""Testes de cadastro e login com PostgreSQL. Utiliza um banco separado, cujo nome deve terminar em "_test".
Atenção: o banco de testes é apagado e recriado durante a execução dos testes."""

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
import psycopg
import pytest

# --- configuração do banco de testes (antes de importar a API, que lê essas variáveis) ---
BANCO = os.environ.get("TEST_DATABASE_URL", "")
if not BANCO.split("?")[0].endswith("_test"):
    pytest.exit("Defina TEST_DATABASE_URL apontando para um banco cujo nome termine em _test (veja o topo deste arquivo).", returncode=2)
os.environ["DATABASE_URL"] = BANCO
os.environ["JWT_SECRET"] = "segredo-usado-somente-nos-testes-0123456789"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def cidades_sem_internet():
    """Mantida por compatibilidade com os outros testes: as cidades agora vêm do JSON local, sem internet."""
    yield


SCHEMA = Path(__file__).resolve().parents[2] / "database" / "schema.sql"
ANA = {"nome": "Ana Souza", "email": "ana@email.com", "cidade": "Anápolis", "estado": "GO",
       "senha": "Senha1234", "confirmacao_senha": "Senha1234"}
BRUNO = {**ANA, "nome": "Bruno Lima", "email": "bruno@email.com", "cidade": "Recife", "estado": "PE"}


@pytest.fixture(scope="session", autouse=True)
def preparar_banco():
    """Apaga o banco de testes e cria as tabelas de novo, com o mesmo schema.sql do projeto."""
    with psycopg.connect(BANCO, autocommit=True) as conn:
        conn.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
        conn.execute(SCHEMA.read_text(encoding="utf-8"))


@pytest.fixture(autouse=True)
def banco_limpo():
    """Antes de cada teste, apaga os usuários (cada teste começa do zero)."""
    with psycopg.connect(BANCO, autocommit=True) as conn:
        conn.execute("TRUNCATE usuario RESTART IDENTITY CASCADE")


@pytest.fixture(scope="session")
def api():
    return TestClient(app)


def cadastrar(api, dados=ANA, **mudancas):
    return api.post("/auth/register", json={**dados, **mudancas})


def entrar(api, email="ana@email.com", senha="Senha1234"):
    return api.post("/auth/login", json={"email": email, "senha": senha})


def cabecalho(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------- cadastro
def test_cadastro_valido(api):
    r = cadastrar(api)
    assert r.status_code == 201
    corpo = r.json()
    assert corpo["access_token"]
    assert corpo["usuario"]["email"] == "ana@email.com"
    assert "senha" not in corpo["usuario"]  # a senha nunca volta para o navegador


def test_senha_fica_salva_como_hash(api):
    cadastrar(api)
    with psycopg.connect(BANCO) as conn:
        salvo = conn.execute("SELECT senha FROM usuario").fetchone()[0]
    assert salvo != "Senha1234"
    assert salvo.startswith("$2b$")  # formato do bcrypt


def test_cadastro_normaliza_email_e_estado(api):
    r = cadastrar(api, email="  ANA@Email.COM ", estado="go")
    assert r.status_code == 201
    assert r.json()["usuario"]["email"] == "ana@email.com"
    assert r.json()["usuario"]["estado"] == "GO"


def test_email_repetido(api):
    assert cadastrar(api).status_code == 201
    r = cadastrar(api, email="ANA@email.com")  # mesmo e-mail, outra grafia
    assert r.status_code == 409
    assert "email" in r.json()["erros"]
    with psycopg.connect(BANCO) as conn:
        assert conn.execute("SELECT count(*) FROM usuario").fetchone()[0] == 1


@pytest.mark.parametrize("campo, valor", [
    ("nome", ""), ("nome", "A"), ("nome", "12345"),
    ("email", "sem-arroba"), ("email", "ana@dominio"),
    ("cidade", ""), ("cidade", "Cidade123"),
    ("estado", "ZZ"), ("estado", "G"),
    ("senha", "Ab1"), ("senha", "somenteletras"), ("senha", "1234567890"),
    ("confirmacao_senha", "Outra1234"),
])
def test_dados_invalidos(api, campo, valor):
    r = cadastrar(api, **{campo: valor})
    assert r.status_code == 422
    assert campo in r.json()["erros"]  # a mensagem vem no campo certo
    with psycopg.connect(BANCO) as conn:
        assert conn.execute("SELECT count(*) FROM usuario").fetchone()[0] == 0


def test_campo_ausente(api):
    dados = {k: v for k, v in ANA.items() if k != "cidade"}
    r = api.post("/auth/register", json=dados)
    assert r.status_code == 422
    assert r.json()["erros"]["cidade"] == "Campo obrigatório."


# ---------------------------------------------------------------- login
def test_login_correto(api):
    cadastrar(api)
    r = entrar(api)
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_login_senha_errada(api):
    cadastrar(api)
    r = entrar(api, senha="Errada1234")
    assert r.status_code == 401
    assert r.json()["mensagem"] == "E-mail ou senha incorretos."


def test_login_email_inexistente_tem_a_mesma_mensagem(api):
    cadastrar(api)
    r = entrar(api, email="ninguem@email.com")
    assert r.status_code == 401
    assert r.json()["mensagem"] == "E-mail ou senha incorretos."


def test_login_sem_preencher(api):
    r = api.post("/auth/login", json={"email": "", "senha": ""})
    assert r.status_code == 422


# ---------------------------------------------------------------- acesso protegido
def test_me_sem_login(api):
    assert api.get("/auth/me").status_code == 401


def test_me_com_token_invalido(api):
    assert api.get("/auth/me", headers=cabecalho("isto-nao-e-um-token")).status_code == 401


def test_me_com_token_de_outro_segredo(api):
    falso = jwt.encode({"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(hours=1)}, "outro-segredo" * 4, algorithm="HS256")
    cadastrar(api)
    assert api.get("/auth/me", headers=cabecalho(falso)).status_code == 401


def test_me_com_token_vencido(api):
    token = cadastrar(api).json()["access_token"]
    id_usuario = api.get("/auth/me", headers=cabecalho(token)).json()["id"]
    vencido = jwt.encode({"sub": str(id_usuario), "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
                         os.environ["JWT_SECRET"], algorithm="HS256")
    assert api.get("/auth/me", headers=cabecalho(vencido)).status_code == 401


def test_me_com_login_valido(api):
    cadastrar(api)
    token = entrar(api).json()["access_token"]
    r = api.get("/auth/me", headers=cabecalho(token))
    assert r.status_code == 200
    assert r.json()["email"] == "ana@email.com"


# ---------------------------------------------------------------- isolamento entre usuários
def test_cada_usuario_ve_somente_os_proprios_dados(api):
    token_ana = cadastrar(api, ANA).json()["access_token"]
    token_bruno = cadastrar(api, BRUNO).json()["access_token"]
    ana = api.get("/auth/me", headers=cabecalho(token_ana)).json()
    bruno = api.get("/auth/me", headers=cabecalho(token_bruno)).json()
    assert (ana["nome"], ana["cidade"]) == ("Ana Souza", "Anápolis")
    assert (bruno["nome"], bruno["cidade"]) == ("Bruno Lima", "Recife")
    assert ana["id"] != bruno["id"]


def test_token_nao_serve_para_virar_outro_usuario(api):
    """Trocar o id dentro do token (sem o segredo) invalida a assinatura."""
    token_ana = cadastrar(api, ANA).json()["access_token"]
    cadastrar(api, BRUNO)
    cabecalho_e_corpo, _ = token_ana.rsplit(".", 1)
    adulterado = cabecalho_e_corpo + ".assinatura-falsa"
    assert api.get("/auth/me", headers=cabecalho(adulterado)).status_code == 401


def test_health(api):
    assert api.get("/health").json() == {"status": "ok"}


# ---------------------------------------------------------------- editar perfil
PERFIL = {"nome": "Ana Maria Souza", "estado": "SP", "cidade": "Campinas", "descricao": "Gosto de ensinar."}


def editar(api, token, **mudancas):
    return api.patch("/auth/me", json={**PERFIL, **mudancas}, headers=cabecalho(token))


def test_editar_perfil_exige_login(api):
    assert api.patch("/auth/me", json=PERFIL).status_code == 401


def test_editar_perfil_salva_e_persiste_apos_novo_login(api):
    token = cadastrar(api).json()["access_token"]
    assert cadastrar(api, BRUNO).status_code == 201
    r = editar(api, token)
    assert r.status_code == 200
    assert (r.json()["nome"], r.json()["estado"], r.json()["cidade"], r.json()["descricao"]) == (
        "Ana Maria Souza", "SP", "Campinas", "Gosto de ensinar.")
    assert r.json()["email"] == "ana@email.com" and "senha" not in r.json()
    # novo login: os dados vêm do banco
    novo = entrar(api).json()
    assert novo["usuario"]["nome"] == "Ana Maria Souza" and novo["usuario"]["descricao"] == "Gosto de ensinar."
    assert api.get("/auth/me", headers=cabecalho(novo["access_token"])).json()["cidade"] == "Campinas"
    # a outra conta não foi afetada
    assert entrar(api, "bruno@email.com").json()["usuario"]["nome"] == "Bruno Lima"


def test_editar_perfil_nao_muda_email_nem_senha_nem_id(api):
    token = cadastrar(api).json()["access_token"]
    id_antes = api.get("/auth/me", headers=cabecalho(token)).json()["id"]
    r = api.patch("/auth/me", json={**PERFIL, "email": "outro@email.com", "senha": "Nova12345", "id": 999}, headers=cabecalho(token))
    assert r.status_code == 200 and r.json()["email"] == "ana@email.com" and r.json()["id"] == id_antes
    assert entrar(api).status_code == 200  # mesmo e-mail e mesma senha
    assert entrar(api, "outro@email.com").status_code == 401


def test_editar_perfil_valida_cidade_do_estado(api):
    token = cadastrar(api).json()["access_token"]
    r = editar(api, token, estado="SP", cidade="Anápolis")  # Anápolis é de GO
    assert r.status_code == 422 and "cidade" in r.json()["erros"]
    assert api.get("/auth/me", headers=cabecalho(token)).json()["cidade"] == "Anápolis"  # nada mudou


@pytest.mark.parametrize("campo,valor", [("nome", "  "), ("nome", "1234"), ("estado", "XX"), ("cidade", ""), ("descricao", "x" * 201)])
def test_editar_perfil_dados_invalidos(api, campo, valor):
    token = cadastrar(api).json()["access_token"]
    r = editar(api, token, **{campo: valor})
    assert r.status_code == 422 and campo in r.json()["erros"]


def test_descricao_vazia_vira_sem_descricao(api):
    token = cadastrar(api).json()["access_token"]
    editar(api, token)
    assert editar(api, token, descricao="   ").json()["descricao"] is None


# ---------------------------------------------------------------- habilidades do perfil
def banco_habilidades(email="ana@email.com"):
    with psycopg.connect(BANCO) as conn:
        return conn.execute(
            "SELECT uh.tipo, h.nome FROM usuario_habilidade uh JOIN habilidade h USING (id_habilidade) "
            "JOIN usuario u USING (id_usuario) WHERE u.email = %s ORDER BY uh.tipo, h.nome", (email,)).fetchall()


def test_cadastro_e_login_devolvem_listas_vazias(api):
    usuario = cadastrar(api).json()["usuario"]
    assert usuario["oferece"] == [] and usuario["procura"] == []
    assert entrar(api).json()["usuario"]["oferece"] == []


def test_habilidades_salvam_listam_e_persistem(api):
    token = cadastrar(api).json()["access_token"]
    r = editar(api, token, oferece=["Edição de vídeo", "Storytelling"], procura=["Inglês"])
    assert r.status_code == 200 and r.json()["oferece"] == ["Edição de vídeo", "Storytelling"] and r.json()["procura"] == ["Inglês"]
    me = api.get("/auth/me", headers=cabecalho(token)).json()
    assert me["oferece"] == ["Edição de vídeo", "Storytelling"] and me["procura"] == ["Inglês"]
    assert entrar(api).json()["usuario"]["procura"] == ["Inglês"]
    # remover: a lista enviada substitui a anterior
    assert editar(api, token, oferece=["Storytelling"]).json()["oferece"] == ["Storytelling"]
    assert editar(api, token, oferece=[]).json()["oferece"] == []


def test_atualizar_perfil_sem_habilidades_preserva_as_salvas(api):
    token = cadastrar(api).json()["access_token"]
    editar(api, token, oferece=["Excel"], procura=["Inglês"])
    r = editar(api, token, nome="Outro Nome")  # não envia oferece/procura
    assert r.json()["nome"] == "Outro Nome" and r.json()["oferece"] == ["Excel"] and r.json()["procura"] == ["Inglês"]
    r = editar(api, token, procura=[])  # só a lista enviada muda
    assert r.json()["oferece"] == ["Excel"] and r.json()["procura"] == []


def test_habilidades_sem_duplicar_por_caixa_ou_espacos(api):
    token = cadastrar(api).json()["access_token"]
    r = editar(api, token, oferece=["  Edição   de vídeo ", "edição de VÍDEO", "Excel"])
    assert r.json()["oferece"] == ["Edição de vídeo", "Excel"]
    # outro usuário reaproveita a mesma habilidade (uma só linha na tabela habilidade)
    token_bruno = cadastrar(api, BRUNO).json()["access_token"]
    assert editar(api, token_bruno, oferece=["EDIÇÃO DE VÍDEO"]).status_code == 200
    with psycopg.connect(BANCO) as conn:
        assert conn.execute("SELECT count(*) FROM habilidade WHERE lower(nome) = 'edição de vídeo'").fetchone()[0] == 1
    assert [t for t in banco_habilidades("bruno@email.com")] == [("oferece", "Edição de vídeo")]


def test_mesma_habilidade_nas_duas_listas_e_permitida(api):
    token = cadastrar(api).json()["access_token"]
    r = editar(api, token, oferece=["Inglês"], procura=["Inglês"])
    assert r.json()["oferece"] == ["Inglês"] and r.json()["procura"] == ["Inglês"]


def test_cada_usuario_so_altera_as_proprias_habilidades(api):
    token_ana = cadastrar(api).json()["access_token"]
    token_bruno = cadastrar(api, BRUNO).json()["access_token"]
    editar(api, token_ana, oferece=["Excel"])
    editar(api, token_bruno, oferece=["Música"], procura=["Excel"])
    assert api.get("/auth/me", headers=cabecalho(token_ana)).json()["oferece"] == ["Excel"]
    assert api.get("/auth/me", headers=cabecalho(token_ana)).json()["procura"] == []
    assert api.patch("/auth/me", json={**PERFIL, "oferece": ["X"]}).status_code == 401  # sem login, nada muda


@pytest.mark.parametrize("campo,valor", [
    ("oferece", ["a", "b", "c", "d", "e", "f", "g"]),  # 7 itens
    ("procura", ["x" * 31]),
    ("oferece", ["Excel", "   "]),
    ("procura", "Excel"),
])
def test_habilidades_invalidas_sao_recusadas(api, campo, valor):
    token = cadastrar(api).json()["access_token"]
    editar(api, token, oferece=["Excel"])
    r = editar(api, token, **{campo: valor})
    assert r.status_code == 422 and campo in r.json()["erros"]
    assert api.get("/auth/me", headers=cabecalho(token)).json()["oferece"] == ["Excel"]  # nada mudou


def test_limites_exatos_sao_aceitos(api):
    token = cadastrar(api).json()["access_token"]
    seis = [f"Habilidade {i}" for i in range(6)]
    assert editar(api, token, oferece=seis, procura=["x" * 30]).status_code == 200


def test_erro_ao_salvar_habilidades_desfaz_o_perfil_inteiro(api):
    token = cadastrar(api).json()["access_token"]
    with psycopg.connect(BANCO, autocommit=True) as conn:  # força falha na gravação da habilidade (regra CHECK temporária)
        conn.execute("ALTER TABLE habilidade ADD CONSTRAINT ck_teste CHECK (nome <> 'Quebra')")
    try:
        with pytest.raises(psycopg.errors.CheckViolation):
            editar(api, token, nome="Nome Novo", oferece=["Excel", "Quebra"])
    finally:
        with psycopg.connect(BANCO, autocommit=True) as conn:
            conn.execute("ALTER TABLE habilidade DROP CONSTRAINT ck_teste")
    me = api.get("/auth/me", headers=cabecalho(token)).json()
    assert me["nome"] == "Ana Souza" and me["oferece"] == []
