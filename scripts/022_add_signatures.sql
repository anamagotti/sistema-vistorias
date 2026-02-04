-- Add signature columns to inspections table
ALTER TABLE public.inspections 
ADD COLUMN IF NOT EXISTS franchisee_signature_url TEXT,
ADD COLUMN IF NOT EXISTS inspector_signature_url TEXT;
