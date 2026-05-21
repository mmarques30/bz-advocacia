-- Seed: vídeo de treinamento inicial + sua transcrição (Google Docs).
-- Idempotente: insere só se ainda não existir um registro com o mesmo drive_url.

INSERT INTO public.treinamentos (titulo, descricao, drive_url, categoria, formato, ativo, ordem)
SELECT
  'Treinamento — Vídeo da plataforma',
  'Vídeo de apresentação e uso da plataforma B&Z Advocacia.',
  'https://drive.google.com/file/d/1QsDqNItHMb8WWXvpcTzyzRCBqHYnSD10/view?usp=sharing',
  'geral',
  'link',
  true,
  0
WHERE NOT EXISTS (
  SELECT 1 FROM public.treinamentos
  WHERE drive_url = 'https://drive.google.com/file/d/1QsDqNItHMb8WWXvpcTzyzRCBqHYnSD10/view?usp=sharing'
);

INSERT INTO public.treinamentos (titulo, descricao, drive_url, categoria, formato, ativo, ordem)
SELECT
  'Treinamento — Transcrição do vídeo',
  'Transcrição completa do vídeo de treinamento, com o passo a passo escrito.',
  'https://docs.google.com/document/d/13JSvSCbyNHMWUjAk2mY1xezoAjWgwU6Wn3DWa9q9RDY/edit?usp=sharing',
  'geral',
  'link',
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM public.treinamentos
  WHERE drive_url = 'https://docs.google.com/document/d/13JSvSCbyNHMWUjAk2mY1xezoAjWgwU6Wn3DWa9q9RDY/edit?usp=sharing'
);
