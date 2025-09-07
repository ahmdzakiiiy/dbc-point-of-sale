-- Add base_price column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS base_price DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Update existing products to have the same base_price as price if they don't already have one
UPDATE public.products 
SET base_price = price 
WHERE base_price IS NULL OR base_price = 0;

-- Add comment
COMMENT ON COLUMN public.products.base_price IS 'Harga modal (purchase/cost price)';
