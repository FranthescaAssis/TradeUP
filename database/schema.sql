-- TradeUP - Criação do banco de dados (PostgreSQL)

-- Tipos enumerados
CREATE TYPE tipo_habilidade_usuario AS ENUM ('oferece', 'procura');
CREATE TYPE tipo_publicacao AS ENUM ('oferta', 'necessidade');
CREATE TYPE modalidade_publicacao AS ENUM ('online', 'presencial', 'ambos');
CREATE TYPE status_publicacao AS ENUM ('ativa', 'concluida', 'cancelada');
CREATE TYPE status_proposta AS ENUM ('pendente', 'aceita', 'recusada', 'cancelada', 'concluida');
CREATE TYPE status_denuncia AS ENUM ('pendente', 'analisada', 'indeferida', 'procedente');

-- Usuários
CREATE TABLE usuario (
    id_usuario     SERIAL PRIMARY KEY,
    nome           VARCHAR(100) NOT NULL,
    email          VARCHAR(100) NOT NULL UNIQUE,
    senha          VARCHAR(255) NOT NULL,
    foto           VARCHAR(255),
    descricao      TEXT,
    cidade         VARCHAR(100) NOT NULL,
    estado         CHAR(2) NOT NULL,
    data_cadastro  TIMESTAMP NOT NULL DEFAULT NOW(),
    status         SMALLINT NOT NULL DEFAULT 1
);

-- Habilidades
CREATE TABLE habilidade (
    id_habilidade  SERIAL PRIMARY KEY,
    nome           VARCHAR(100) NOT NULL,
    categoria      VARCHAR(100),
    descricao      TEXT,
    status         SMALLINT NOT NULL DEFAULT 1
);

-- Habilidades dos usuários
CREATE TABLE usuario_habilidade (
    id_usuario     INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_habilidade  INT NOT NULL REFERENCES habilidade(id_habilidade) ON DELETE CASCADE,
    tipo           tipo_habilidade_usuario NOT NULL,
    data_cadastro  TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id_usuario, id_habilidade, tipo)
);

-- Publicações
CREATE TABLE publicacao (
    id_publicacao  SERIAL PRIMARY KEY,
    id_usuario     INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    titulo         VARCHAR(150) NOT NULL,
    descricao      TEXT NOT NULL,
    categoria      VARCHAR(100) NOT NULL,
    tipo           tipo_publicacao NOT NULL,
    modalidade     modalidade_publicacao NOT NULL,
    contrapartida  TEXT,  -- o que o autor oferece em troca (obrigatório, pela API, nas solicitações)
    status         status_publicacao NOT NULL DEFAULT 'ativa',
    data_criacao   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Propostas de troca
CREATE TABLE proposta (
    id_proposta    SERIAL PRIMARY KEY,
    id_publicacao  INT NOT NULL REFERENCES publicacao(id_publicacao) ON DELETE CASCADE,
    id_usuario     INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    mensagem       TEXT,
    status         status_proposta NOT NULL DEFAULT 'pendente',
    data_troca     DATE,
    data_proposta  TIMESTAMP NOT NULL DEFAULT NOW(),
    oferta         TEXT,
    tipo_data      VARCHAR(12) NOT NULL DEFAULT 'a_combinar',
    data_fim       DATE,

    -- Tipos de data permitidos
    CONSTRAINT ck_proposta_tipo_data
        CHECK (tipo_data IN ('unica', 'periodo', 'a_combinar')),

    -- Uma proposta por usuário em cada publicação
    CONSTRAINT uq_proposta_usuario_publicacao
        UNIQUE (id_publicacao, id_usuario)
);

-- Uma proposta aceita por publicação
CREATE UNIQUE INDEX uq_proposta_aceita_por_publicacao
    ON proposta (id_publicacao)
    WHERE status = 'aceita';

-- Mensagens
CREATE TABLE mensagem (
    id_mensagem    SERIAL PRIMARY KEY,
    id_proposta    INT NOT NULL REFERENCES proposta(id_proposta) ON DELETE CASCADE,
    id_remetente   INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    conteudo       TEXT NOT NULL,
    data_envio     TIMESTAMP NOT NULL DEFAULT NOW(),
    lida           BOOLEAN NOT NULL DEFAULT FALSE
);

-- Avaliações
CREATE TABLE avaliacao (
    id_avaliacao   SERIAL PRIMARY KEY,
    id_proposta    INT NOT NULL REFERENCES proposta(id_proposta) ON DELETE CASCADE,
    id_avaliador   INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_avaliado    INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    nota           SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario     TEXT,
    data_avaliacao TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_avaliacao_por_troca
        UNIQUE (id_proposta, id_avaliador)
);

-- Denúncias
CREATE TABLE denuncia (
    id_denuncia     SERIAL PRIMARY KEY,
    id_denunciante  INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_publicacao   INT REFERENCES publicacao(id_publicacao) ON DELETE SET NULL,
    id_proposta     INT REFERENCES proposta(id_proposta) ON DELETE SET NULL,
    motivo          TEXT NOT NULL,
    status          status_denuncia NOT NULL DEFAULT 'pendente',
    data_denuncia   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para otimizar consultas
CREATE INDEX idx_publicacao_status_data ON publicacao (status, data_criacao DESC);
CREATE INDEX idx_publicacao_categoria ON publicacao (categoria);
CREATE INDEX idx_proposta_usuario ON proposta (id_usuario);
CREATE INDEX idx_proposta_publicacao ON proposta (id_publicacao);
CREATE INDEX idx_mensagem_proposta ON mensagem (id_proposta, data_envio);