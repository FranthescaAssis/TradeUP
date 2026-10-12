-- Dados iniciais de apoio (categorias/habilidades usadas no protótipo)
-- Pode ser executado mais de uma vez: só insere o que ainda não existe (pelo nome).
INSERT INTO habilidade (nome, categoria)
SELECT v.nome, v.categoria
FROM (VALUES
  ('Inglês', 'Idiomas'),
  ('Edição de Vídeo', 'Tecnologia'),
  ('Programação', 'Tecnologia'),
  ('Excel', 'Tecnologia'),
  ('Design Gráfico', 'Design'),
  ('Fotografia', 'Artes'),
  ('Storytelling', 'Marketing'),
  ('Roteiro', 'Marketing'),
  ('Música', 'Artes'),
  ('Culinária', 'Bem-estar'),
  ('Organização financeira', 'Finanças')
) AS v(nome, categoria)
WHERE NOT EXISTS (SELECT 1 FROM habilidade h WHERE h.nome = v.nome);
