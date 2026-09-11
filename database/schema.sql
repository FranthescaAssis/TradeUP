-- ============================================================
-- TradeUp - Script de criação do banco de dados (PostgreSQL)
-- Baseado no Diagrama Entidade-Relacionamento do projeto
-- ============================================================

-- ------------------------------------------------------------
-- TIPOS ENUMERADOS
-- ------------------------------------------------------------
CREATE TYPE tipo_habilidade_usuario AS ENUM ('oferece', 'procura');
CREATE TYPE tipo_publicacao AS ENUM ('oferta', 'necessidade');
CREATE TYPE modalidade_publicacao AS ENUM ('online', 'presencial', 'ambos');
CREATE TYPE status_publicacao AS ENUM ('ativa', 'concluida', 'cancelada');
CREATE TYPE status_proposta AS ENUM ('pendente', 'aceita', 'recusada', 'cancelada', 'concluida');
CREATE TYPE status_denuncia AS ENUM ('pendente', 'analisada', 'indeferida', 'procedente');

-- ------------------------------------------------------------
-- ESTADO/CIDADE
-- ------------------------------------------------------------
CREATE TABLE estado (
    id    INTEGER PRIMARY KEY,      -- ID do IBGE
    sigla VARCHAR(2) UNIQUE NOT NULL,
    nome  VARCHAR(100) NOT NULL
);

CREATE TABLE cidade (
    id        INTEGER PRIMARY KEY,  -- ID do IBGE
    nome      VARCHAR(100) NOT NULL,
    estado_id INTEGER NOT NULL REFERENCES estado(id)
);

-- ------------------------------------------------------------
-- USUARIO
-- ------------------------------------------------------------
CREATE TABLE usuario (
    id_usuario     SERIAL PRIMARY KEY,
    nome           VARCHAR(100) NOT NULL,
    email          VARCHAR(100) NOT NULL UNIQUE,
    senha          VARCHAR(255) NOT NULL,             -- armazenada com hash (bcrypt) - RNF-004
    foto           VARCHAR(255),
    descricao      TEXT,
    cidade_id      INTEGER NOT NULL REFERENCES cidade(id),
    data_cadastro  TIMESTAMP NOT NULL DEFAULT NOW(),
    status         SMALLINT NOT NULL DEFAULT 1        -- 1 = ativo, 0 = bloqueado/inativo (RN-001)
);

-- ------------------------------------------------------------
-- HABILIDADE
-- ------------------------------------------------------------
CREATE TABLE habilidade (
    id_habilidade  SERIAL PRIMARY KEY,
    nome           VARCHAR(100) NOT NULL,
    categoria      VARCHAR(100),
    descricao      TEXT,
    status         SMALLINT NOT NULL DEFAULT 1
);

-- ------------------------------------------------------------
-- USUARIO_HABILIDADE (associativa N:N)
-- ------------------------------------------------------------
CREATE TABLE usuario_habilidade (
    id_usuario     INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_habilidade  INT NOT NULL REFERENCES habilidade(id_habilidade) ON DELETE CASCADE,
    tipo           tipo_habilidade_usuario NOT NULL,
    data_cadastro  TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id_usuario, id_habilidade, tipo)
);

-- ------------------------------------------------------------
-- PUBLICACAO (ofertas e necessidades) - RF-002 / RN-003
-- ------------------------------------------------------------
CREATE TABLE publicacao (
    id_publicacao  SERIAL PRIMARY KEY,
    id_usuario     INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    titulo         VARCHAR(150) NOT NULL,
    descricao      TEXT NOT NULL,
    categoria      VARCHAR(100) NOT NULL,
    tipo           tipo_publicacao NOT NULL,
    modalidade     modalidade_publicacao NOT NULL,
    status         status_publicacao NOT NULL DEFAULT 'ativa',
    data_criacao   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- PROPOSTA - RF-006 / RN-006
-- ------------------------------------------------------------
CREATE TABLE proposta (
    id_proposta    SERIAL PRIMARY KEY,
    id_publicacao  INT NOT NULL REFERENCES publicacao(id_publicacao) ON DELETE CASCADE,
    id_usuario     INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,  -- quem propõe
    mensagem       TEXT,
    status         status_proposta NOT NULL DEFAULT 'pendente',
    data_troca     DATE,
    data_proposta  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- MENSAGEM (chat da proposta) - RF-004 / RN-004
-- ------------------------------------------------------------
CREATE TABLE mensagem (
    id_mensagem    SERIAL PRIMARY KEY,
    id_proposta    INT NOT NULL REFERENCES proposta(id_proposta) ON DELETE CASCADE,
    id_remetente   INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    conteudo       TEXT NOT NULL,
    data_envio     TIMESTAMP NOT NULL DEFAULT NOW(),
    lida           BOOLEAN NOT NULL DEFAULT FALSE
);

-- ------------------------------------------------------------
-- AVALIACAO - RF-003 / RN-002 / RN-007
-- ------------------------------------------------------------
CREATE TABLE avaliacao (
    id_avaliacao   SERIAL PRIMARY KEY,
    id_proposta    INT NOT NULL REFERENCES proposta(id_proposta) ON DELETE CASCADE,
    id_avaliador   INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_avaliado    INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    nota           SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario     TEXT,
    data_avaliacao TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_avaliacao_por_troca UNIQUE (id_proposta, id_avaliador)   -- RN-002: uma avaliação por troca
);

-- ------------------------------------------------------------
-- DENUNCIA - RF-008 / RN-005
-- ------------------------------------------------------------
CREATE TABLE denuncia (
    id_denuncia     SERIAL PRIMARY KEY,
    id_denunciante  INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_publicacao   INT REFERENCES publicacao(id_publicacao) ON DELETE SET NULL,
    id_proposta     INT REFERENCES proposta(id_proposta) ON DELETE SET NULL,
    motivo          TEXT NOT NULL,
    status          status_denuncia NOT NULL DEFAULT 'pendente',
    data_denuncia   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- INDEX
-- ------------------------------------------------------------
-- Índices de apoio às consultas mais frequentes (Explorar / Minhas trocas / Chat)
CREATE INDEX idx_cidade_estado          ON cidade (estado_id);
CREATE INDEX idx_publicacao_status_data ON publicacao (status, data_criacao DESC);
CREATE INDEX idx_publicacao_categoria   ON publicacao (categoria);
CREATE INDEX idx_proposta_usuario       ON proposta (id_usuario);
CREATE INDEX idx_proposta_publicacao    ON proposta (id_publicacao);
CREATE INDEX idx_mensagem_proposta      ON mensagem (id_proposta, data_envio);
