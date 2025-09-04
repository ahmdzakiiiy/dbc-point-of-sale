-- Create a SQL execution function in Supabase (only run this once if it doesn't exist)
-- Note: This requires superuser privileges and may need to be executed by a Supabase administrator

CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;
