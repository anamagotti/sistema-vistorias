-- Adicionar coluna para múltiplas fotos
ALTER TABLE public.checklist_items 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Migrar fotos existentes para o novo array
UPDATE public.checklist_items 
SET photos = ARRAY[photo_url] 
WHERE photo_url IS NOT NULL AND photo_url != '' AND (photos IS NULL OR photos = '{}');
