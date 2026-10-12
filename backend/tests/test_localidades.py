"""Testes da lista local de municípios, sem internet nem banco de dados."""
import json
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.services import localidades_service as localidades
from app.banco import get_conn
from app.main import app
from app.schemas.comum import UFS


def test_json_completo():
    dados = json.loads(localidades.ARQUIVO.read_text(encoding='utf-8'))
    assert set(dados) == UFS
    assert all(lista and lista == sorted(lista) for lista in dados.values())
    assert sum(len(lista) for lista in dados.values()) >= 5570
    assert dados['DF'] == ['Brasília']


def test_estado_invalido():
    with pytest.raises(HTTPException) as erro:
        localidades.buscar_cidades('ZZ')
    assert erro.value.status_code == 422


def test_nao_usa_internet():
    # Qualquer tentativa de acesso à rede quebraria este teste.
    with patch('socket.socket', side_effect=AssertionError('acessou a rede')):
        assert 'Anápolis' in localidades.buscar_cidades('go')


def test_rota_cidades():
    resposta = TestClient(app).get('/localidades/go/cidades')
    assert resposta.status_code == 200
    assert 'Anápolis' in resposta.json()


def test_rota_estado_invalido():
    assert TestClient(app).get('/localidades/zz/cidades').status_code == 422


def test_nome_oficial():
    assert localidades.validar_cidade_estado('anápolis', 'GO') == 'Anápolis'


@pytest.mark.parametrize('cidade', ['Recife', 'Cidade Inventada'])
def test_cadastro_recusa_cidade_antes_de_inserir(cidade):
    class Banco:
        def execute(self, *args):
            pytest.fail('Não pode inserir usuário com cidade inválida')
    app.dependency_overrides[get_conn] = lambda: Banco()
    try:
        resposta = TestClient(app).post('/auth/register', json={
            'nome': 'Ana Souza', 'email': 'ana@email.com',
            'cidade': cidade, 'estado': 'GO',
            'senha': 'Senha1234', 'confirmacao_senha': 'Senha1234'})
        assert resposta.status_code == 422
        assert 'cidade' in resposta.json()['erros']
    finally:
        app.dependency_overrides.clear()
