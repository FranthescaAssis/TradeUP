-- TradeUP - Atualização de um banco já existente (propostas e contrapartida das publicações)

BEGIN;

-- Contrapartida do autor da publicação (usada nas solicitações; na oferta o próprio anúncio é a contrapartida)
ALTER TABLE publicacao
    ADD COLUMN IF NOT EXISTS contrapartida TEXT;

-- Adiciona campos para a oferta e as datas sugeridas
ALTER TABLE proposta
    ADD COLUMN IF NOT EXISTS oferta TEXT,
    ADD COLUMN IF NOT EXISTS tipo_data VARCHAR(12) NOT NULL DEFAULT 'a_combinar',
    ADD COLUMN IF NOT EXISTS data_fim DATE;

-- Permite apenas os tipos de data definidos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_proposta_tipo_data') THEN
        ALTER TABLE proposta
            ADD CONSTRAINT ck_proposta_tipo_data
            CHECK (tipo_data IN ('unica', 'periodo', 'a_combinar'));
    END IF;
END $$;

-- Permite uma proposta por usuário em cada publicação
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_proposta_usuario_publicacao') THEN
        ALTER TABLE proposta
            ADD CONSTRAINT uq_proposta_usuario_publicacao
            UNIQUE (id_publicacao, id_usuario);
    END IF;
END $$;

-- Permite apenas uma proposta aceita por publicação
CREATE UNIQUE INDEX IF NOT EXISTS uq_proposta_aceita_por_publicacao
    ON proposta (id_publicacao)
    WHERE status = 'aceita';

COMMIT;
