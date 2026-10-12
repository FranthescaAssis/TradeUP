"""Ponto de entrada da API. Para rodar:  uvicorn app.main:app --reload"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from app.routes import auth, localidades, propostas, publicacoes
from app.config import CORS_ORIGINS

app = FastAPI(title="TradeUp API")

# CORS: só o front local pode chamar a API pelo navegador.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(localidades.router)
app.include_router(publicacoes.router)
app.include_router(propostas.router)


@app.get("/health", tags=["Saúde"])
def health():
    return {"status": "ok"}


# Todos os erros saem no mesmo formato, que o front sabe ler:  {"mensagem": "...", "erros": {"campo": "..."}}
@app.exception_handler(HTTPException)
async def erro_http(request: Request, exc: HTTPException):
    corpo = exc.detail if isinstance(exc.detail, dict) else {"mensagem": exc.detail}
    return JSONResponse(corpo, status_code=exc.status_code)


@app.exception_handler(RequestValidationError)
async def erro_de_validacao(request: Request, exc: RequestValidationError):
    erros = {}
    for e in exc.errors():
        campo = str(e["loc"][1]) if len(e["loc"]) > 1 else "corpo"
        if e["type"] == "missing":
            msg = "Campo obrigatório."
        elif e["type"] == "value_error":  # as mensagens que escrevemos em schemas/
            msg = e["msg"].removeprefix("Value error, ")
        else:
            msg = "Valor inválido."
        erros.setdefault(campo, msg)
    return JSONResponse({"mensagem": "Revise os campos destacados.", "erros": erros}, status_code=422)
