"""Configurações lidas do arquivo backend/.env (ou das variáveis de ambiente).

Nenhum segredo fica escrito no código. Se algo obrigatório faltar, a API não inicia e diz o que fazer.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "")
JWT_SECRET = os.getenv("JWT_SECRET", "")
TOKEN_MINUTOS = 60  # quanto tempo o login vale
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]

if not DATABASE_URL:
    raise SystemExit("ERRO: DATABASE_URL não definido. Copie backend/.env.example para backend/.env e preencha.")
if len(JWT_SECRET) < 32:
    raise SystemExit(
        "ERRO: JWT_SECRET ausente ou curto demais (mínimo 32 caracteres). Gere um com:\n"
        '  python -c "import secrets; print(secrets.token_urlsafe(48))"\n'
        "e cole em backend/.env depois de JWT_SECRET="
    )
