
"""Testes de criação e listagem de publicações."""

import pytest

# Importa funções e dados dos testes de autenticação.
from test_auth import ANA, BRUNO, api, banco_limpo, cabecalho, cadastrar, cidades_sem_internet, preparar_banco  # noqa: F401

PUBLICACAO = {
    "titulo": "Aulas de inglês para conversação",
    "descricao": "Ensino conversação em inglês, online, em horários flexíveis.",
    "categoria": "Idiomas",
    "tipo": "oferta",
    "modalidade": "online",
}


def token_de(api, dados=ANA):
    return cadastrar(api, dados).json()["access_token"]


def publicar(api, token, **mudancas):
    return api.post("/publicacoes", json={**PUBLICACAO, **mudancas}, headers=cabecalho(token))


def test_criar_exige_login(api):
    assert api.post("/publicacoes", json=PUBLICACAO).status_code == 401


def test_listar_exige_login(api):
    assert api.get("/publicacoes").status_code == 401


def test_criar_publicacao_valida(api):
    r = publicar(api, token_de(api))
    assert r.status_code == 201
    corpo = r.json()
    assert corpo["titulo"] == PUBLICACAO["titulo"]
    assert corpo["tipo"] == "oferta"
    assert corpo["autor"]["nome"] == "Ana Souza"
    assert corpo["autor"]["cidade"] == "Anápolis"
    assert "email" not in corpo["autor"]


def test_dono_vem_do_token_e_nao_do_corpo(api):
    token_ana = token_de(api)
    token_de(api, BRUNO)
    r = publicar(api, token_ana, id_usuario=2)  # tentativa de publicar "como" o Bruno
    assert r.json()["autor"]["nome"] == "Ana Souza"


def test_listar_mostra_mais_recente_primeiro(api):
    token = token_de(api)
    publicar(api, token, titulo="Primeira publicação")
    publicar(api, token, titulo="Segunda publicação")
    titulos = [p["titulo"] for p in api.get("/publicacoes", headers=cabecalho(token)).json()]
    assert titulos == ["Segunda publicação", "Primeira publicação"]


def test_todos_veem_publicacoes_de_outros(api):
    publicar(api, token_de(api))
    token_bruno = token_de(api, BRUNO)
    lista = api.get("/publicacoes", headers=cabecalho(token_bruno)).json()
    assert len(lista) == 1 and lista[0]["autor"]["nome"] == "Ana Souza"


@pytest.mark.parametrize("campo, valor", [
    ("titulo", "abc"),
    ("titulo", "   "),
    ("titulo", "x" * 151),
    ("descricao", "curta"),
    ("categoria", "Inexistente"),
    ("tipo", "troca"),
    ("modalidade", "telepatia"),
])
def test_dados_invalidos(api, campo, valor):
    r = publicar(api, token_de(api), **{campo: valor})
    assert r.status_code == 422
    assert campo in r.json()["erros"]


def test_campo_ausente(api):
    dados = {k: v for k, v in PUBLICACAO.items() if k != "modalidade"}
    r = api.post("/publicacoes", json=dados, headers=cabecalho(token_de(api)))
    assert r.status_code == 422 and "modalidade" in r.json()["erros"]


# ---------------------------------------------------------------- contrapartida (solicitação de ajuda)
SOLICITACAO = {**PUBLICACAO, "titulo": "Preciso de ajuda com planilhas", "tipo": "necessidade", "contrapartida": "Aulas de inglês"}


def test_solicitacao_exige_contrapartida(api):
    token = token_de(api)
    sem_campo = {k: v for k, v in SOLICITACAO.items() if k != "contrapartida"}
    r = api.post("/publicacoes", json=sem_campo, headers=cabecalho(token))
    assert r.status_code == 422 and "contrapartida" in r.json()["erros"]
    for invalida in ("   ", "ab", "x" * 501):
        r = publicar(api, token, **{**SOLICITACAO, "contrapartida": invalida})
        assert r.status_code == 422 and "contrapartida" in r.json()["erros"]


def test_solicitacao_valida_guarda_contrapartida(api):
    r = publicar(api, token_de(api), **SOLICITACAO)
    assert r.status_code == 201 and r.json()["contrapartida"] == "Aulas de inglês"


def test_oferta_nao_exige_nem_guarda_contrapartida(api):
    token = token_de(api)
    assert publicar(api, token).json()["contrapartida"] is None
    assert publicar(api, token, contrapartida="ignorada").json()["contrapartida"] is None
