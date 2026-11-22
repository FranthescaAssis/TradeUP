FROM node:22-bookworm-slim AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/index.html frontend/vite.config.js ./
COPY frontend/public ./public
COPY frontend/src ./src
RUN VITE_API_URL=/api npm run build

FROM python:3.12-slim-bookworm
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /tradeup/backend
COPY backend/requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY database/schema.sql /tradeup/database/schema.sql
COPY --from=frontend /build/dist /tradeup/frontend/dist
USER 10001
CMD ["sh", "-c", "exec python -m uvicorn app.hospedagem:app --host 0.0.0.0 --port ${PORT:-10000}"]
