# ADMIN NOTICE: Database Schema Update Required

## Issue: Missing `base_price` Column in Products Table

The application is currently experiencing an error:
```
Gagal mengubah produk: Database error: Could not find the 'base_price' column of 'products' in the schema cache (Kode: PGRST204)
```

This occurs because the `base_price` column is referenced in the code but does not exist in the database schema.

## Immediate Workaround

A temporary workaround has been implemented that will allow the application to function without the `base_price` column. However, this is not a permanent solution and the column should be added to the database as soon as possible.

## Required Database Migration

Please execute the following SQL in your Supabase SQL editor to add the missing column:

```sql
-- Add base_price column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS base_price DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Update existing products to have the same base_price as price if they don't already have one
UPDATE public.products 
SET base_price = price 
WHERE base_price IS NULL OR base_price = 0;

-- Add comment
COMMENT ON COLUMN public.products.base_price IS 'Harga modal (purchase/cost price)';
```

## After Migration

Once the database migration is complete, the temporary workarounds can be removed by:

1. Updating the code in `app/stock/page.tsx` to include `base_price` in API calls
2. Updating the code in `app/api/products/[id]/route.ts` to include `base_price` in the update payload
3. Updating the code in `app/api/products/route.ts` to include `base_price` in the insert payload

The codebase already includes proper handling of the `base_price` field, it just needs the database schema to match.
