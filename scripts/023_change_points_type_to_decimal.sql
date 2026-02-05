-- Change points columns to store decimal values (for half-points logic)
ALTER TABLE public.inspections ALTER COLUMN total_points TYPE NUMERIC(10, 2);
ALTER TABLE public.inspections ALTER COLUMN points_achieved TYPE NUMERIC(10, 2);

-- Update the calculate function comment or logic if needed, but the columns are the most important part.
-- This allows storing 2.5, 7.5 etc. which happens when an item has an observation and loses half points.
