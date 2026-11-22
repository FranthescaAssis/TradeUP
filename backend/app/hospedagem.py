"""Entrada de produção que serve a aplicação React e a API no mesmo domínio."""

from contextlib import asynccontextmanager
from pathlib import Path

import psycopg
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.config import DATABASE_URL
from app.main import app as api

RAIZ = Path(__file__).resolve().parents[2]
DIST = RAIZ / "frontend" / "dist"
SCHEMA = RAIZ / "database" / "schema.sql"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Serializa a inicialização se dois processos subirem com o mesmo banco.
    with psycopg.connect(DATABASE_URL, connect_timeout=5) as conn:
        conn.execute("SELECT pg_advisory_xact_lock(hashtext('tradeup.schema'))")
        tabela = conn.execute("SELECT to_regclass('public.usuario')").fetchone()
        if tabela == (None,):
            conn.execute(SCHEMA.read_text(encoding="utf-8"))
    yield


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/api", api)
app.mount("/assets", StaticFiles(directory=DIST / "assets"))


@app.get("/healthz")
def healthz():
    try:
        with psycopg.connect(DATABASE_URL, connect_timeout=5) as conn:
            conn.execute("SELECT 1 FROM public.usuario LIMIT 1")
    except psycopg.Error:
        raise HTTPException(503, "Banco de dados indisponível.") from None
    return {"status": "ok"}


@app.get("/api", include_in_schema=False)
def api_raiz():
    return RedirectResponse("/api/docs")


@app.api_route("/{caminho:path}", methods=["GET", "HEAD"], include_in_schema=False)
def frontend(caminho: str):
    return FileResponse(DIST / "index.html", headers={"Cache-Control": "no-cache"})
