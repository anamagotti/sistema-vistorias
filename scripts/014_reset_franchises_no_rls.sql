-- ATENÇÃO: Este script vai limpar as franquias e recriá-las para garantir que não há erros.
-- Isso também vai apagar vistorias de teste vinculadas a essas franquias.

-- 1. Desabilitar a segurança (RLS) da tabela de franquias para garantir que todos vejam
ALTER TABLE public.franchises DISABLE ROW LEVEL SECURITY;

-- 2. Limpar tabela de franquias
DELETE FROM public.franchises;

-- 3. Inserir as franquias novamente
INSERT INTO public.franchises (name, location) VALUES
  ('Bar do Português - São José do Rio Preto', 'São José do Rio Preto, SP'),
  ('Bar do Português - Lençóis Paulista', 'Lençóis Paulista, SP'),
  ('Bar do Português - Araraquara', 'Araraquara, SP'),
  ('Bar do Português - Bauru', 'Bauru, SP');
