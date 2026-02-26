-- Adicionar coluna slug à tabela projects
ALTER TABLE public.projects 
ADD COLUMN slug text UNIQUE;

-- Criar um índice para buscas rápidas por slug
CREATE INDEX IF NOT EXISTS projects_slug_idx ON public.projects (slug);

-- Comentário para documentação
COMMENT ON COLUMN public.projects.slug IS 'URL amigável para a landing page do projeto';
