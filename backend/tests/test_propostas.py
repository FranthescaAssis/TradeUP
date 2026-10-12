"""Testes das propostas de troca (mesmo banco de testes do test_auth.py; veja o topo daquele arquivo)."""
from datetime import date, timedelta

import psycopg
import pytest

# Reaproveita as fixtures e os ajudantes dos outros arquivos de teste (banco de testes limpo a cada teste).
from test_auth import ANA, BANCO, BRUNO, api, banco_limpo, cabecalho, cadastrar, cidades_sem_internet, preparar_banco  # noqa: F401
from test_publicacoes import SOLICITACAO, publicar, token_de

CARLA = {**ANA, "nome": "Carla Dias", "email": "carla@email.com"}
HOJE = date.today()


def proposta_dados(id_publicacao, **mudancas):
    return {"id_publicacao": id_publicacao, "oferta": "Aulas de violão", "mensagem": "Vamos trocar?", **mudancas}


def propor(api, token, id_publicacao, **mudancas):
    return api.post("/propostas", json=proposta_dados(id_publicacao, **mudancas), headers=cabecalho(token))


def responder(api, token, id_proposta, status):
    return api.patch(f"/propostas/{id_proposta}", json={"status": status}, headers=cabecalho(token))


@pytest.fixture
def cenario(api):
    """Ana publica; Bruno e Carla são interessados."""
    ana, bruno, carla = token_de(api), token_de(api, BRUNO), token_de(api, CARLA)
    id_pub = publicar(api, ana).json()["id"]
    return {"api": api, "ana": ana, "bruno": bruno, "carla": carla, "pub": id_pub}


# ---------------------------------------------------------------- enviar proposta
def test_enviar_exige_login(api):
    assert api.post("/propostas", json=proposta_dados(1)).status_code == 401


def test_enviar_proposta_valida(cenario):
    r = propor(cenario["api"], cenario["bruno"], cenario["pub"])
    assert r.status_code == 201
    corpo = r.json()
    assert corpo["status"] == "pendente"
    assert corpo["oferta"] == "Aulas de violão"
    assert corpo["tipo_data"] == "a_combinar" and corpo["data_troca"] is None
    assert corpo["proponente"]["nome"] == "Bruno Lima"  # veio do token
    assert corpo["dono"]["nome"] == "Ana Souza"
    assert corpo["publicacao"]["id"] == cenario["pub"]
    assert "email" not in corpo["proponente"] and "email" not in corpo["dono"]


def test_nao_pode_propor_para_publicacao_propria(cenario):
    r = propor(cenario["api"], cenario["ana"], cenario["pub"])
    assert r.status_code == 403


def test_publicacao_inexistente(cenario):
    assert propor(cenario["api"], cenario["bruno"], 9999).status_code == 404


def test_uma_proposta_por_usuario_por_publicacao(cenario):
    api, c = cenario["api"], cenario
    assert propor(api, c["bruno"], c["pub"]).status_code == 201
    assert propor(api, c["bruno"], c["pub"]).status_code == 409


def test_nao_pode_propor_de_novo_apos_recusa(cenario):
    api, c = cenario["api"], cenario
    id_proposta = propor(api, c["bruno"], c["pub"]).json()["id"]
    assert responder(api, c["ana"], id_proposta, "recusada").status_code == 200
    assert propor(api, c["bruno"], c["pub"]).status_code == 409


def test_varios_usuarios_podem_propor_para_a_mesma_publicacao(cenario):
    api, c = cenario["api"], cenario
    assert propor(api, c["bruno"], c["pub"]).status_code == 201
    assert propor(api, c["carla"], c["pub"]).status_code == 201
    assert len(api.get("/propostas/recebidas", headers=cabecalho(c["ana"])).json()) == 2


def test_usuario_nao_pode_ser_dono_vindo_do_corpo(cenario):
    """Mandar id_usuario no corpo é ignorado: o proponente é sempre o dono do token."""
    r = cenario["api"].post("/propostas", json={**proposta_dados(cenario["pub"]), "id_usuario": 1},
                            headers=cabecalho(cenario["bruno"]))
    assert r.json()["proponente"]["nome"] == "Bruno Lima"


# ---------------------------------------------------------------- validação dos dados
@pytest.mark.parametrize("campo, valor", [
    ("oferta", "ab"),
    ("oferta", "   "),
    ("oferta", "x" * 501),
    ("mensagem", "x" * 1001),
    ("tipo_data", "amanha"),
    ("data_troca", "isso-nao-e-data"),
])
def test_dados_invalidos(cenario, campo, valor):
    r = propor(cenario["api"], cenario["bruno"], cenario["pub"], **{campo: valor})
    assert r.status_code == 422 and campo in r.json()["erros"]


def test_oferta_ausente(cenario):
    dados = {"id_publicacao": cenario["pub"]}
    r = cenario["api"].post("/propostas", json=dados, headers=cabecalho(cenario["bruno"]))
    assert r.status_code == 422 and "oferta" in r.json()["erros"]


def test_data_unica_valida(cenario):
    amanha = (HOJE + timedelta(days=1)).isoformat()
    r = propor(cenario["api"], cenario["bruno"], cenario["pub"], tipo_data="unica", data_troca=amanha, data_fim="2030-01-01")
    assert r.status_code == 201
    assert r.json()["data_troca"] == amanha and r.json()["data_fim"] is None  # data_fim é ignorada


def test_data_unica_exige_data(cenario):
    r = propor(cenario["api"], cenario["bruno"], cenario["pub"], tipo_data="unica")
    assert r.status_code == 422 and "data_troca" in r.json()["erros"]


def test_data_no_passado_e_recusada(cenario):
    ontem = (HOJE - timedelta(days=1)).isoformat()
    r = propor(cenario["api"], cenario["bruno"], cenario["pub"], tipo_data="unica", data_troca=ontem)
    assert r.status_code == 422 and "data_troca" in r.json()["erros"]


def test_periodo_valido(cenario):
    inicio, fim = HOJE + timedelta(days=1), HOJE + timedelta(days=7)
    r = propor(cenario["api"], cenario["bruno"], cenario["pub"], tipo_data="periodo",
               data_troca=inicio.isoformat(), data_fim=fim.isoformat())
    assert r.status_code == 201
    assert (r.json()["data_troca"], r.json()["data_fim"]) == (inicio.isoformat(), fim.isoformat())


def test_periodo_exige_data_final(cenario):
    r = propor(cenario["api"], cenario["bruno"], cenario["pub"], tipo_data="periodo",
               data_troca=(HOJE + timedelta(days=1)).isoformat())
    assert r.status_code == 422 and "data_fim" in r.json()["erros"]


def test_periodo_com_fim_antes_do_inicio(cenario):
    r = propor(cenario["api"], cenario["bruno"], cenario["pub"], tipo_data="periodo",
               data_troca=(HOJE + timedelta(days=5)).isoformat(), data_fim=(HOJE + timedelta(days=2)).isoformat())
    assert r.status_code == 422 and "data_fim" in r.json()["erros"]


def test_a_combinar_ignora_datas(cenario):
    r = propor(cenario["api"], cenario["bruno"], cenario["pub"], tipo_data="a_combinar",
               data_troca="2000-01-01", data_fim="2000-01-02")
    assert r.status_code == 201 and r.json()["data_troca"] is None and r.json()["data_fim"] is None


# ---------------------------------------------------------------- listar e detalhar
def test_listas_exigem_login(api):
    for rota in ("/propostas/enviadas", "/propostas/recebidas", "/propostas/1"):
        assert api.get(rota).status_code == 401


def test_enviadas_e_recebidas(cenario):
    api, c = cenario["api"], cenario
    propor(api, c["bruno"], c["pub"])
    enviadas_bruno = api.get("/propostas/enviadas", headers=cabecalho(c["bruno"])).json()
    recebidas_bruno = api.get("/propostas/recebidas", headers=cabecalho(c["bruno"])).json()
    recebidas_ana = api.get("/propostas/recebidas", headers=cabecalho(c["ana"])).json()
    enviadas_ana = api.get("/propostas/enviadas", headers=cabecalho(c["ana"])).json()
    assert len(enviadas_bruno) == 1 and recebidas_bruno == []
    assert len(recebidas_ana) == 1 and enviadas_ana == []


def test_so_participantes_veem_os_detalhes(cenario):
    api, c = cenario["api"], cenario
    id_proposta = propor(api, c["bruno"], c["pub"]).json()["id"]
    assert api.get(f"/propostas/{id_proposta}", headers=cabecalho(c["bruno"])).status_code == 200
    assert api.get(f"/propostas/{id_proposta}", headers=cabecalho(c["ana"])).status_code == 200
    assert api.get(f"/propostas/{id_proposta}", headers=cabecalho(c["carla"])).status_code == 404
    assert api.get("/propostas/9999", headers=cabecalho(c["ana"])).status_code == 404


# ---------------------------------------------------------------- aceitar e recusar
def test_responder_exige_login(api):
    assert api.patch("/propostas/1", json={"status": "aceita"}).status_code == 401


def test_dono_aceita(cenario):
    api, c = cenario["api"], cenario
    id_proposta = propor(api, c["bruno"], c["pub"]).json()["id"]
    r = responder(api, c["ana"], id_proposta, "aceita")
    assert r.status_code == 200 and r.json()["status"] == "aceita"
    # o status fica salvo: uma nova consulta (como após recarregar a página) mostra o mesmo
    assert api.get(f"/propostas/{id_proposta}", headers=cabecalho(c["bruno"])).json()["status"] == "aceita"


def test_dono_recusa_e_publicacao_segue_disponivel(cenario):
    api, c = cenario["api"], cenario
    id_proposta = propor(api, c["bruno"], c["pub"]).json()["id"]
    assert responder(api, c["ana"], id_proposta, "recusada").json()["status"] == "recusada"
    assert propor(api, c["carla"], c["pub"]).status_code == 201  # outros interessados continuam podendo propor
    assert api.get(f"/publicacoes/{c['pub']}", headers=cabecalho(c["carla"])).json()["disponivel"] is True


def test_so_o_dono_responde(cenario):
    api, c = cenario["api"], cenario
    id_proposta = propor(api, c["bruno"], c["pub"]).json()["id"]
    assert responder(api, c["bruno"], id_proposta, "aceita").status_code == 403  # quem propôs não decide
    assert responder(api, c["carla"], id_proposta, "aceita").status_code == 404  # quem não participa nem a enxerga
    assert api.get(f"/propostas/{id_proposta}", headers=cabecalho(c["ana"])).json()["status"] == "pendente"


def test_proposta_inexistente(cenario):
    assert responder(cenario["api"], cenario["ana"], 9999, "aceita").status_code == 404


@pytest.mark.parametrize("status", ["pendente", "cancelada", "qualquer"])
def test_status_nao_permitidos_nesta_etapa(cenario, status):
    id_proposta = propor(cenario["api"], cenario["bruno"], cenario["pub"]).json()["id"]
    r = responder(cenario["api"], cenario["ana"], id_proposta, status)
    assert r.status_code == 422 and "status" in r.json()["erros"]


def test_proposta_respondida_nao_muda_mais(cenario):
    api, c = cenario["api"], cenario
    id_proposta = propor(api, c["bruno"], c["pub"]).json()["id"]
    responder(api, c["ana"], id_proposta, "recusada")
    assert responder(api, c["ana"], id_proposta, "aceita").status_code == 409


def test_aceitar_recusa_as_outras_pendentes(cenario):
    api, c = cenario["api"], cenario
    id_bruno = propor(api, c["bruno"], c["pub"]).json()["id"]
    id_carla = propor(api, c["carla"], c["pub"]).json()["id"]
    assert responder(api, c["ana"], id_bruno, "aceita").status_code == 200
    assert api.get(f"/propostas/{id_bruno}", headers=cabecalho(c["bruno"])).json()["status"] == "aceita"
    assert api.get(f"/propostas/{id_carla}", headers=cabecalho(c["carla"])).json()["status"] == "recusada"


def test_so_uma_proposta_aceita_por_publicacao(cenario):
    api, c = cenario["api"], cenario
    id_bruno = propor(api, c["bruno"], c["pub"]).json()["id"]
    id_carla = propor(api, c["carla"], c["pub"]).json()["id"]
    responder(api, c["ana"], id_bruno, "aceita")
    assert responder(api, c["ana"], id_carla, "aceita").status_code == 409  # a da Carla já foi recusada


def test_publicacao_com_proposta_aceita_fica_indisponivel(cenario):
    api, c = cenario["api"], cenario
    id_bruno = propor(api, c["bruno"], c["pub"]).json()["id"]
    responder(api, c["ana"], id_bruno, "aceita")
    # não aceita novas propostas...
    assert propor(api, c["carla"], c["pub"]).status_code == 409
    # ...continua com status 'ativa' no banco...
    with psycopg.connect(BANCO) as conn:
        assert conn.execute("SELECT status FROM publicacao").fetchone()[0] == "ativa"
    # ...mas some do Explorar e aparece como indisponível ao ser consultada diretamente
    assert api.get("/publicacoes", headers=cabecalho(c["carla"])).json() == []
    assert api.get(f"/publicacoes/{c['pub']}", headers=cabecalho(c["carla"])).json()["disponivel"] is False


def test_banco_impede_duas_aceitas_na_mesma_publicacao(cenario):
    """Última linha de defesa: mesmo ignorando o código da API, o próprio PostgreSQL recusa."""
    api, c = cenario["api"], cenario
    id_bruno = propor(api, c["bruno"], c["pub"]).json()["id"]
    id_carla = propor(api, c["carla"], c["pub"]).json()["id"]
    with psycopg.connect(BANCO) as conn:
        conn.execute("UPDATE proposta SET status = 'aceita' WHERE id_proposta = %s", (id_bruno,))
        with pytest.raises(psycopg.errors.UniqueViolation):
            conn.execute("UPDATE proposta SET status = 'aceita' WHERE id_proposta = %s", (id_carla,))


def test_aceites_simultaneos_resultam_em_uma_unica_aceita(cenario):
    """Dois aceites disparados ao mesmo tempo: um vence (200) e o outro é recusado (409)."""
    from concurrent.futures import ThreadPoolExecutor

    from fastapi.testclient import TestClient

    from app.main import app

    api, c = cenario["api"], cenario
    ids = [propor(api, c["bruno"], c["pub"]).json()["id"], propor(api, c["carla"], c["pub"]).json()["id"]]

    def aceitar(id_proposta):
        with TestClient(app) as cliente:
            return responder(cliente, c["ana"], id_proposta, "aceita").status_code

    with ThreadPoolExecutor(2) as pool:
        codigos = sorted(pool.map(aceitar, ids))
    assert codigos == [200, 409]
    with psycopg.connect(BANCO) as conn:
        assert conn.execute("SELECT COUNT(*) FROM proposta WHERE status = 'aceita'").fetchone()[0] == 1


# ---------------------------------------------------------------- publicação por id
def test_buscar_publicacao_por_id(cenario):
    r = cenario["api"].get(f"/publicacoes/{cenario['pub']}", headers=cabecalho(cenario["bruno"]))
    assert r.status_code == 200 and r.json()["autor"]["nome"] == "Ana Souza" and r.json()["disponivel"] is True
    assert cenario["api"].get("/publicacoes/9999", headers=cabecalho(cenario["bruno"])).status_code == 404
    assert cenario["api"].get(f"/publicacoes/{cenario['pub']}").status_code == 401


def test_cors_permite_patch(api):
    r = api.options("/propostas/1", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "PATCH"})
    assert r.status_code == 200 and "PATCH" in r.headers["access-control-allow-methods"]


# ---------------------------------------------------------------- contrapartida dos dois lados
def test_proposta_para_solicitacao_mostra_contrapartida_do_autor(cenario):
    api, c = cenario["api"], cenario
    id_pub = publicar(api, c["ana"], **SOLICITACAO).json()["id"]
    corpo = propor(api, c["bruno"], id_pub, oferta="Faço planilhas no Excel").json()
    assert corpo["publicacao"]["tipo"] == "necessidade"
    assert corpo["publicacao"]["contrapartida"] == "Aulas de inglês"


def test_proposta_exige_oferta_tambem_em_solicitacao(cenario):
    api, c = cenario["api"], cenario
    id_pub = publicar(api, c["ana"], **SOLICITACAO).json()["id"]
    r = propor(api, c["bruno"], id_pub, oferta="  ")
    assert r.status_code == 422 and "oferta" in r.json()["erros"]


def test_aceitar_solicitacao_com_as_duas_contrapartidas(cenario):
    api, c = cenario["api"], cenario
    id_pub = publicar(api, c["ana"], **SOLICITACAO).json()["id"]
    id_proposta = propor(api, c["bruno"], id_pub, oferta="Faço planilhas no Excel").json()["id"]
    assert responder(api, c["ana"], id_proposta, "aceita").json()["status"] == "aceita"


def _apagar_contrapartida(id_pub):
    with psycopg.connect(BANCO, autocommit=True) as conn:
        conn.execute("UPDATE publicacao SET contrapartida = NULL WHERE id_publicacao = %s", (id_pub,))


def test_solicitacao_sem_contrapartida_nao_recebe_proposta_nem_e_aceita(cenario):
    """Cobre dados antigos/inseridos por fora do app: a regra vale mesmo assim."""
    api, c = cenario["api"], cenario
    id_pub = publicar(api, c["ana"], **SOLICITACAO).json()["id"]
    id_proposta = propor(api, c["bruno"], id_pub, oferta="Faço planilhas no Excel").json()["id"]
    _apagar_contrapartida(id_pub)
    assert propor(api, c["carla"], id_pub).status_code == 409
    assert responder(api, c["ana"], id_proposta, "aceita").status_code == 409
    assert responder(api, c["ana"], id_proposta, "recusada").status_code == 200  # recusar continua permitido


def test_nao_aceita_proposta_sem_oferta(cenario):
    api, c = cenario["api"], cenario
    id_proposta = propor(api, c["bruno"], c["pub"]).json()["id"]
    with psycopg.connect(BANCO, autocommit=True) as conn:
        conn.execute("UPDATE proposta SET oferta = NULL WHERE id_proposta = %s", (id_proposta,))
    assert responder(api, c["ana"], id_proposta, "aceita").status_code == 409


# ---------------------------------------------------------------- concluir troca
def _aceita(c):
    id_proposta = propor(c["api"], c["bruno"], c["pub"]).json()["id"]
    responder(c["api"], c["ana"], id_proposta, "aceita")
    return id_proposta


@pytest.mark.parametrize("quem", ["ana", "bruno"])
def test_qualquer_participante_conclui(cenario, quem):
    api, c = cenario["api"], cenario
    id_proposta = _aceita(c)
    r = responder(api, c[quem], id_proposta, "concluida")
    assert r.status_code == 200 and r.json()["status"] == "concluida"
    assert api.get(f"/propostas/{id_proposta}", headers=cabecalho(c["ana"])).json()["status"] == "concluida"


def test_concluir_atualiza_a_publicacao_e_ela_nao_volta(cenario):
    api, c = cenario["api"], cenario
    responder(api, c["bruno"], _aceita(c), "concluida")
    with psycopg.connect(BANCO) as conn:
        assert conn.execute("SELECT status FROM publicacao").fetchone()[0] == "concluida"
    assert api.get("/publicacoes", headers=cabecalho(c["carla"])).json() == []
    assert api.get(f"/publicacoes/{c['pub']}", headers=cabecalho(c["carla"])).json()["disponivel"] is False
    assert propor(api, c["carla"], c["pub"]).status_code == 409


def test_so_participantes_concluem(cenario):
    api, c = cenario["api"], cenario
    id_proposta = _aceita(c)
    assert responder(api, c["carla"], id_proposta, "concluida").status_code == 404
    assert api.get(f"/propostas/{id_proposta}", headers=cabecalho(c["ana"])).json()["status"] == "aceita"


def test_concluir_exige_login(api):
    assert api.patch("/propostas/1", json={"status": "concluida"}).status_code == 401


@pytest.mark.parametrize("quem", ["ana", "bruno"])
def test_nao_conclui_proposta_pendente_ou_recusada(cenario, quem):
    api, c = cenario["api"], cenario
    id_proposta = propor(api, c["bruno"], c["pub"]).json()["id"]
    assert responder(api, c[quem], id_proposta, "concluida").status_code == 409
    responder(api, c["ana"], id_proposta, "recusada")
    assert responder(api, c[quem], id_proposta, "concluida").status_code == 409


def test_nao_conclui_duas_vezes(cenario):
    api, c = cenario["api"], cenario
    id_proposta = _aceita(c)
    responder(api, c["ana"], id_proposta, "concluida")
    assert responder(api, c["bruno"], id_proposta, "concluida").status_code == 409


def test_proposta_concluida_nao_pode_ser_respondida_de_novo(cenario):
    api, c = cenario["api"], cenario
    id_proposta = _aceita(c)
    responder(api, c["ana"], id_proposta, "concluida")
    assert responder(api, c["ana"], id_proposta, "recusada").status_code == 409
    assert responder(api, c["ana"], id_proposta, "aceita").status_code == 409


# ---------------------------------------------------------------- minhas publicações / cancelar
def cancelar(api, token, id_pub):
    return api.patch(f"/publicacoes/{id_pub}", json={"status": "cancelada"}, headers=cabecalho(token))


def test_minhas_publicacoes_so_traz_as_proprias(cenario):
    api, c = cenario["api"], cenario
    publicar(api, c["bruno"], titulo="Aulas de violão para iniciantes")
    r = api.get("/publicacoes/minhas", headers=cabecalho(c["ana"]))
    assert r.status_code == 200
    assert [p["id"] for p in r.json()] == [c["pub"]]
    assert r.json()[0]["status"] == "ativa" and r.json()[0]["disponivel"] is True
    assert api.get("/publicacoes/minhas").status_code == 401


def test_cancelar_exige_login(api):
    assert api.patch("/publicacoes/1", json={"status": "cancelada"}).status_code == 401


def test_cancelar_publicacao_cancela_pendentes_e_some_do_explorar(cenario):
    api, c = cenario["api"], cenario
    id_bruno = propor(api, c["bruno"], c["pub"]).json()["id"]
    id_carla = propor(api, c["carla"], c["pub"]).json()["id"]
    r = cancelar(api, c["ana"], c["pub"])
    assert r.status_code == 200 and r.json()["status"] == "cancelada" and r.json()["disponivel"] is False
    for token, id_proposta in ((c["bruno"], id_bruno), (c["carla"], id_carla)):
        assert api.get(f"/propostas/{id_proposta}", headers=cabecalho(token)).json()["status"] == "cancelada"
    assert api.get("/publicacoes", headers=cabecalho(c["carla"])).json() == []
    assert api.get("/publicacoes/minhas", headers=cabecalho(c["ana"])).json()[0]["status"] == "cancelada"
    assert propor(api, c["carla"], c["pub"]).status_code == 409  # não recebe novas propostas


def test_cancelar_nao_mexe_em_propostas_ja_recusadas(cenario):
    api, c = cenario["api"], cenario
    id_bruno = propor(api, c["bruno"], c["pub"]).json()["id"]
    responder(api, c["ana"], id_bruno, "recusada")
    assert cancelar(api, c["ana"], c["pub"]).status_code == 200
    assert api.get(f"/propostas/{id_bruno}", headers=cabecalho(c["bruno"])).json()["status"] == "recusada"


def test_so_o_dono_cancela(cenario):
    api, c = cenario["api"], cenario
    assert cancelar(api, c["bruno"], c["pub"]).status_code == 403
    assert cancelar(api, c["ana"], 9999).status_code == 404
    assert api.get(f"/publicacoes/{c['pub']}", headers=cabecalho(c["ana"])).json()["status"] == "ativa"


def test_nao_cancela_duas_vezes(cenario):
    api, c = cenario["api"], cenario
    cancelar(api, c["ana"], c["pub"])
    assert cancelar(api, c["ana"], c["pub"]).status_code == 409


def test_nao_cancela_com_proposta_aceita_nem_concluida(cenario):
    api, c = cenario["api"], cenario
    id_proposta = _aceita(c)
    assert cancelar(api, c["ana"], c["pub"]).status_code == 409
    assert api.get(f"/propostas/{id_proposta}", headers=cabecalho(c["ana"])).json()["status"] == "aceita"
    r = api.get("/publicacoes/minhas", headers=cabecalho(c["ana"])).json()[0]
    assert r["status"] == "ativa" and r["disponivel"] is False  # aceita: a tela mostra "Troca aceita"
    responder(api, c["ana"], id_proposta, "concluida")
    assert cancelar(api, c["ana"], c["pub"]).status_code == 409
    assert api.get("/publicacoes/minhas", headers=cabecalho(c["ana"])).json()[0]["status"] == "concluida"


def test_so_aceita_o_valor_cancelada(cenario):
    r = cenario["api"].patch(f"/publicacoes/{cenario['pub']}", json={"status": "ativa"}, headers=cabecalho(cenario["ana"]))
    assert r.status_code == 422


def test_nao_aceita_nem_conclui_proposta_cancelada(cenario):
    api, c = cenario["api"], cenario
    id_proposta = propor(api, c["bruno"], c["pub"]).json()["id"]
    cancelar(api, c["ana"], c["pub"])
    assert responder(api, c["ana"], id_proposta, "aceita").status_code == 409
    assert responder(api, c["bruno"], id_proposta, "concluida").status_code == 409
