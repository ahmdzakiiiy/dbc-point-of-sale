-- Check if the base_price column already exists
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'transaction_items'
        AND column_name = 'base_price'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        -- Add base_price column to the transaction_items table
        ALTER TABLE transaction_items ADD COLUMN base_price NUMERIC(10, 2);
        RAISE NOTICE 'Column base_price added to transaction_items table';
    ELSE
        RAISE NOTICE 'Column base_price already exists in transaction_items table';
    END IF;
END $$;
