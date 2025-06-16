# Database Setup Instructions

## Table Creation

To set up your Supabase database tables, please follow these steps:

1. Login to your Supabase dashboard
2. Go to the SQL Editor
3. Create each of the tables by copying and pasting the SQL commands below

## SQL Commands

### Products Table

```sql
-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up permissions
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete" ON public.products FOR DELETE USING (true);
```

### Transactions Table

```sql
-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up permissions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON public.transactions FOR INSERT WITH CHECK (true);
```

### Transaction Items Table

```sql
-- Create transaction_items table
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up permissions
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.transaction_items FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON public.transaction_items FOR INSERT WITH CHECK (true);
```

## After Creating Tables

After creating all tables, run the verification script to check that everything is set up correctly:

```bash
npm run verify-tables
```

If all tables are verified successfully, you can then use the application normally.
