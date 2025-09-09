# Profit Calculation Implementation

This document outlines the updates made to the reporting system to properly calculate and display profit information based on product base prices (modal).

## Changes Made

1. Updated the database schema:
   - Added `base_price` column to `transaction_items` table to store the base price (modal) of products at the time of sale

2. Updated the checkout process:
   - Modified the API to store base_price in transaction_items when a transaction is created

3. Updated the reporting system:
   - Modified the transaction list API to calculate profit for each transaction
   - Updated the report summary to display total profit
   - Added profit column to transaction list table
   - Added profit information to PDF reports

## How Profit is Calculated

For each transaction item:
```
item_profit = (item.price - item.base_price) × item.quantity
```

For a complete transaction:
```
transaction_profit = sum of all item_profits
```

For the monthly report:
```
total_profit = sum of all transaction_profits
```

## SQL Migration

To add the required column to your database, run the following SQL script in Supabase SQL Editor:

```sql
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
```

## Implementation Notes

1. When creating a new transaction, the base_price is stored alongside the selling price
2. For historical transactions that don't have base_price data, the profit will be shown as zero or not available
3. The profit calculation is accurate for all new transactions going forward

## Next Steps

1. Run the SQL migration script in Supabase SQL Editor
2. Test the system with new transactions to ensure profit calculations are working correctly
