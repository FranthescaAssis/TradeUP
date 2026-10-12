# TradeUP

Plataforma de troca de habilidades e conhecimentos entre pessoas (Projeto Integrador – UniEVANGÉLICA).

## 1. Sobre o TradeUP

O TradeUP conecta pessoas que querem **trocar o que sabem fazer**, sem dinheiro envolvido. Quem sabe editar vídeos pode trocar com quem ensina inglês, por exemplo.

Como funciona:

1. A pessoa cria uma conta e publica uma **oferta** ("posso ensinar...") ou uma **solicitação** ("preciso de ajuda com..."; nesse caso informa o que oferece em troca).
2. Outras pessoas encontram a publicação na tela **Explorar** (com busca e filtros) e enviam uma **proposta**, dizendo o que oferecem.
3. O autor da publicação **aceita ou recusa** cada proposta. Ao aceitar uma, as outras pendentes da mesma publicação são recusadas.
4. Com a proposta aceita, qualquer um dos dois participantes pode marcar a troca como **concluída**.

## 2. Tecnologias utilizadas

| Categoria | O que é usado |
| --- | --- |
| Frontend | JavaScript (JSX), React 19, Vite 7. CSS próprio (sem biblioteca de componentes). |
| Backend | Python, FastAPI, Uvicorn, Pydantic (validação dos dados), psycopg 3 (acesso ao banco, com SQL escrito à mão), python-dotenv (leitura do `.env`). |
| Banco de dados | PostgreSQL. |
| Autenticação | Senhas guardadas como **hash bcrypt** (nunca em texto puro). No login a API devolve um **token JWT** (assinado com `JWT_SECRET`, válido por 60 minutos), que o frontend envia no cabeçalho `Authorization: Bearer ...`. O usuário sempre é identificado pelo token, nunca por dados enviados pelo cliente. |
| Testes | pytest e httpx (`TestClient` do FastAPI), executados em um banco PostgreSQL separado. |

## 3. Funcionalidades implementadas

Estas funcionalidades estão integradas ao backend e ao PostgreSQL:

- **Cadastro e login**, com escolha de estado e cidade (lista local de municípios do IBGE, conferida pelo backend).
- **Autenticação e proteção de rotas**: páginas privadas exigem login; sessão vencida leva de volta ao login; sair da conta apaga o token.
- **Publicações**: criar ofertas e solicitações e listá-las nas telas Início e Explorar.
- **Busca e filtros** na tela Explorar.
- **Envio de propostas**, com mensagem e data sugerida (única, período ou a combinar). Não é possível propor para a própria publicação nem enviar duas propostas para a mesma.
- **Propostas enviadas e recebidas**, na tela Minhas trocas, com filtro por status.
- **Aceite e recusa** de propostas pelo autor da publicação.
- **Conclusão de trocas**: uma proposta aceita pode ser concluída por qualquer um dos dois participantes. A publicação também passa a "concluída" e não volta a aparecer como disponível.
- **Minhas publicações** (aba em Minhas trocas): ver as próprias publicações e cancelar as que estão ativas e sem proposta aceita. As propostas pendentes dessa publicação também são canceladas.
- **Perfil**: ver o próprio perfil e editar nome, estado, cidade e descrição. O e-mail só é exibido. As alterações ficam salvas no banco.

## 4. Funcionalidades futuras ou demonstrativas

As telas abaixo existem como **referência visual** e usam dados de exemplo. Elas **não** funcionam de verdade ainda:

- **Chat e mensagens** (o envio de mensagens não está disponível).
- **Notificações** (a lista é fixa, escrita no código).
- **Avaliações** (a tela existe, mas não envia nada). No seu perfil, a reputação aparece vazia.
- **Denúncias**.
- **Detalhes da troca, proposta recebida, perfil público de outras pessoas e "propor troca" a partir do perfil**: telas de demonstração, fora do fluxo real (o fluxo real é Explorar → Proposta → Minhas trocas).
- **Foto de perfil** (a tela de edição mostra o campo, mas não o salva). As habilidades ("O que você oferece" e "O que você procura") já são salvas no banco e aparecem no seu perfil.
- **Configurações** (troca de e-mail e senha, privacidade, notificações, exclusão de conta), **recuperação e redefinição de senha** e as telas de **onboarding**: apenas telas, sem efeito.

As tabelas `mensagem`, `avaliacao` e `denuncia` já existem no banco, preparadas para essas etapas (`habilidade` e `usuario_habilidade` já estão em uso).

## 5. Estrutura de pastas

```text
TradeUP-teste/
├── backend/
│   ├── app/
│   │   ├── main.py            # inicia a API, CORS e formato dos erros
│   │   ├── config.py          # lê o .env
│   │   ├── banco.py           # conexão com o PostgreSQL
│   │   ├── seguranca.py       # hash de senha (bcrypt) e token (JWT)
│   │   ├── dependencias.py    # exige login nas rotas protegidas
│   │   ├── routes/            # endpoints: auth, publicacoes, propostas, localidades
│   │   ├── services/          # regras de negócio
│   │   ├── repositories/      # comandos SQL
│   │   ├── schemas/           # validação dos dados de entrada
│   │   └── data/municipios.json   # estados e cidades (IBGE)
│   ├── scripts/gerar_municipios.py  # atualiza o municipios.json (uso manual)
│   ├── tests/                 # testes automatizados (pytest)
│   ├── requirements.txt       # dependências do backend
│   └── .env.example           # modelo do arquivo .env
├── database/
│   ├── schema.sql             # cria tipos e tabelas
│   ├── seed.sql               # dados iniciais (opcional)
│   └── atualizacao_propostas.sql  # só para bancos criados antes dessa versão
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # rotas e proteção de páginas
│   │   ├── pages/             # telas (Dashboard, Explore, Mytrades, Proposal, PublicProfile, EditProfile...)
│   │   ├── components/        # componentes reutilizáveis (NewPost, Feedback...)
│   │   ├── auth/              # contexto de login e validações de formulário
│   │   └── services/          # comunicação com a API (api.js)
│   ├── public/assets/         # imagens
│   ├── package.json           # dependências e comandos do frontend
│   ├── vite.config.js
│   └── .env.example           # modelo do arquivo .env
├── docs/                      # documento de especificação (PDF)
└── README.md
```

Os arquivos `.env` (privados) e as pastas geradas (`node_modules`, `.venv`, `dist`) não são enviados ao GitHub.

## 6. Requisitos para executar

- **Python 3.11 ou superior**
- **Node.js** compatível com o Vite 7: 20.19 ou superior na linha 20, ou 22.12 ou superior. O npm vem junto.
- **PostgreSQL** (com o pgAdmin, para criar o banco)
- **VS Code**

## 7. Primeira configuração (Windows + VS Code)

Faça uma única vez.

**7.1 Abrir o projeto.** No VS Code, use **Arquivo → Abrir Pasta** e escolha a pasta `TradeUP-teste`. Abra um terminal em **Terminal → Novo Terminal** (PowerShell).

**7.2 Criar o banco.** No pgAdmin:

1. Clique com o botão direito em **Databases → Create → Database**, crie o banco `tradeup` e confirme.
2. Clique com o botão direito em **tradeup → Query Tool**.
3. Abra o arquivo `database/schema.sql`, copie todo o conteúdo para a Query Tool e execute uma vez.
4. Opcional: faça o mesmo com `database/seed.sql` (habilidades iniciais).

O `atualizacao_propostas.sql` só é necessário para um banco antigo, criado antes das propostas. Um banco novo criado pelo `schema.sql` não precisa dele.

**7.3 Backend.** No terminal, a partir da pasta principal do projeto:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Abra `backend/.env` e preencha:

- `DATABASE_URL`: troque `SUA_SENHA_AQUI` pela senha do usuário `postgres` do seu PostgreSQL.
- `JWT_SECRET`: gere uma chave com o comando abaixo e cole depois do `=`.

```powershell
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"
```

Se aparecer erro de permissão ao ativar o ambiente virtual, não precisa ativá-lo: os comandos deste README usam o Python de dentro da `.venv` diretamente.

**7.4 Frontend.** Em outro terminal, a partir da pasta principal do projeto:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

O `frontend/.env` já vem com `VITE_API_URL=http://localhost:8000`, que é o padrão do backend. Só altere se mudar a porta.

> Nunca envie os arquivos `.env` ao GitHub nem compartilhe a senha do banco ou o `JWT_SECRET`.

## 8. Iniciar no dia a dia

Com o PostgreSQL ligado, abra **dois terminais** no VS Code, ambos na pasta principal do projeto.

**Terminal 1 – backend:**

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Para conferir, abra <http://localhost:8000/health>: deve aparecer `{"status":"ok"}`.

**Terminal 2 – frontend:**

```powershell
cd frontend
npm run dev
```

Abra no navegador o endereço mostrado no terminal, normalmente <http://localhost:5173>.

Para encerrar, pressione `Ctrl + C` em cada terminal.

Não é preciso reinstalar as dependências nem recriar o banco a cada uso. Só instale de novo se o `requirements.txt` ou o `package.json` mudarem.

## 9. Testes automatizados

Os testes usam um **banco separado**, para não tocar nos dados do TradeUP.

1. No pgAdmin, crie o banco `tradeup_test` (uma única vez).
2. Em um terminal, na pasta principal do projeto:

```powershell
cd backend
$env:TEST_DATABASE_URL = "postgresql://postgres:SUA_SENHA@localhost:5432/tradeup_test"
.\.venv\Scripts\python.exe -m pytest
```

Troque `SUA_SENHA` pela senha do seu PostgreSQL. Todos os testes devem passar (levam alguns minutos).

Cuidados:

- **Os testes apagam e recriam as tabelas do banco de testes a cada execução.** Nunca aponte `TEST_DATABASE_URL` para o banco `tradeup`.
- Como proteção, os testes só rodam se o nome do banco terminar em `_test`; caso contrário são encerrados antes de qualquer alteração.
- A variável `TEST_DATABASE_URL` vale só para o terminal onde foi definida.

## 10. Roteiro rápido de teste manual

1. Sem login, abra `/dashboard`: deve redirecionar para o login.
2. Crie duas contas (uma em janela anônima), por exemplo Ana e Bruno.
3. Ana cria uma publicação. Bruno a encontra em Explorar e envia uma proposta.
4. Ana aceita a proposta em **Minhas trocas → Recebidas** e depois clica em **Concluir troca**.
5. Em **Minhas publicações**, Ana cria outra publicação e a cancela.
6. Em **Perfil → Editar perfil**, altere nome, cidade e descrição, saia da conta e entre de novo: os dados devem permanecer.

## Problemas comuns

| Sintoma | O que conferir |
| --- | --- |
| API não inicia e cita `DATABASE_URL` ou `JWT_SECRET` | Confira o preenchimento de `backend/.env`. |
| Não foi possível acessar o banco | Confira se o PostgreSQL está ligado e se a conexão no `.env` está correta. |
| Site não conversa com a API | Mantenha o backend ligado e confira `VITE_API_URL` no `frontend/.env`. |
| Frontend abriu em outra porta | Libere a porta 5173 ou ajuste `CORS_ORIGINS` em `backend/.env` para o endereço mostrado pelo Vite e reinicie o backend. |
| Cidades não carregam | Confirme que o backend está rodando. |
| API mostra 404 em `/` ou `/favicon.ico` | Esses caminhos não existem. Use `/health` para conferir a API. |
