"""Conexão com o PostgreSQL: uma conexão por requisição, aberta e fechada automaticamente."""
import psycopg
from fastapi import HTTPException
from psycopg.rows import dict_row

from app.config import DATABASE_URL


def get_conn():
    """Dependência do FastAPI. Dentro do 'with', o commit é automático se tudo deu certo e o rollback se deu erro."""
    try:
        conn = psycopg.connect(DATABASE_URL, row_factory=dict_row, connect_timeout=5, options="-c timezone=UTC")
    except psycopg.OperationalError:
        raise HTTPException(503, "Não foi possível acessar o banco de dados. Verifique se o PostgreSQL está ligado.") from None
    with conn:
        yield conn
