# TradeUp

> Troque o que você sabe, descubra o que vem depois.

O **TradeUp** é uma plataforma web para troca de habilidades, serviços e conhecimentos entre pessoas, sem envolvimento financeiro. O usuário cadastra o que oferece e o que procura, publica ofertas ou necessidades, envia e recebe propostas de troca, conversa por chat e avalia a experiência ao final.

Projeto Integrador do curso de Engenharia de Software – UniEVANGÉLICA (7º período).

## Equipe

| Integrante                  | Função                   |
| --------------------------- | ------------------------ |
| Ana Laura Teodoro Gonçalves | Product Owner / Back-end |
| Franthesca Assis Pereira    | Back-end                 |
| Luisa Galera Moreira        | Front-end                |

## Tecnologias

- **Front-end:** React + Vite, HTML, CSS e JavaScript
- **Back-end:** Node.js + Express (API REST), JWT e bcrypt
- **Banco de dados:** PostgreSQL
- **Design:** Figma

## Estrutura do repositório

```
TradeUP/
├── frontend/          # aplicação React + Vite
│   └── src/
│       ├── components/   # botões, cards, formulários, menus
│       ├── pages/        # telas da aplicação
│       ├── services/     # chamadas à API REST
│       └── styles/       # CSS e identidade visual
├── backend/           # API REST em Node.js
│   ├── server.js
│   └── src/
│       ├── routes/        # definição das rotas
│       ├── controllers/   # recebimento e tratamento das requisições
│       ├── services/      # regras de negócio
│       ├── repositories/  # acesso aos dados (PostgreSQL)
│       ├── models/
│       ├── middlewares/   # autenticação e tratamento de erros
│       └── config/        # conexão com o banco
├── database/          # scripts SQL (schema e dados iniciais)
└── docs/              # documentação do projeto
```

## Como executar

### Pré-requisitos

- Node.js 20+
- PostgreSQL 14+

### 1. Banco de dados

```bash
sudo -u postgres dropdb tradeup # caso já exista uma db com mesmo nome
sudo -u postgres createdb tradeup
sudo -u postgres psql -d tradeup -f database/schema.sql
sudo -u postgres psql -d tradeup -f database/seed.sql
```

### 2. Back-end

```bash
cd backend
cp .env.example .env      # ajuste DATABASE* e JWT_SECRET
npm install
npm run seed-estados-cidades
npm run dev               # http://localhost:3333
```

Teste: `GET http://localhost:3333/health`

### 3. Front-end

```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

## Identidade visual

| Cor            | Hex       |
| -------------- | --------- |
| Roxo principal | `#6A5AE8` |
| Roxo escuro    | `#2B1A66` |
| Lilás claro    | `#DEDAF3` |
| Creme (fundo)  | `#FAF9F5` |
| Amarelo pastel | `#FBE4B8` |

## Documentação

O Documento de Especificação do Projeto Integrador está em [`docs/`](docs/).

## Status

Fase 01 do 7º período – estrutura inicial do projeto, protótipo no Figma e modelagem do banco concluídos. Implementação das funcionalidades do MVP em andamento.
