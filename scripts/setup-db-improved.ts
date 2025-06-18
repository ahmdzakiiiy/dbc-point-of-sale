import { supabase } from "../lib/supabase";

async function setupDatabase() {
  console.log("Starting database setup...");

  try {
    // ------ SETUP USERS TABLE ------
    console.log("Setting up users table...");

    // Check if users table exists by attempting to select from it
    try {
      const { error } = await supabase.from("users").select("count").limit(1);

      if (error) {
        console.error("Error checking users table:", error);
        console.log(
          "Users table likely does not exist. Please run the following SQL in Supabase SQL Editor:"
        );
        console.log(`
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          -- For RLS policies
          ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Allow public access" ON public.users FOR SELECT USING (true);
          CREATE POLICY "Allow authenticated insert" ON public.users FOR INSERT WITH CHECK (true);
        `);

        console.log("After running the SQL, run this script again.");
        return;
      }

      // If no error, table exists
      console.log("Users table exists, continuing...");
    } catch (error) {
      console.error("Error checking if users table exists:", error);
      return;
    }

    console.log("Users table exists, checking for admin user...");

    // Check if admin user exists
    const { data: adminUser, error: adminCheckError } = await supabase
      .from("users")
      .select("id, username")
      .eq("username", "admin")
      .maybeSingle();

    if (adminCheckError) {
      console.error("Error checking for admin user:", adminCheckError);
      return;
    }

    // Create admin user if it doesn't exist
    if (!adminUser) {
      console.log("Creating admin user...");

      const { data: newAdmin, error: createAdminError } = await supabase
        .from("users")
        .insert({
          username: "admin",
          password: "password123", // In production, this should be hashed
        })
        .select()
        .single();

      if (createAdminError) {
        console.error("Error creating admin user:", createAdminError);
        console.log(
          "This could be due to permission issues or RLS policies. Please check your Supabase settings."
        );
      } else {
        console.log("Admin user created with ID:", newAdmin.id);
      }
    } else {
      console.log("Admin user already exists with ID:", adminUser.id);
    }

    // ------ SETUP PRODUCTS TABLE ------
    console.log("\nSetting up products table...");

    // Check if products table exists
    try {
      const { error } = await supabase
        .from("products")
        .select("count")
        .limit(1);

      if (error) {
        console.error("Error checking products table:", error);
        console.log(
          "Products table likely does not exist. Please run the following SQL in Supabase SQL Editor:"
        );
        console.log(`
          CREATE TABLE IF NOT EXISTS public.products (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            price DECIMAL(12, 2) NOT NULL DEFAULT 0,
            image_url TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          -- For RLS policies
          ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Allow public access" ON public.products FOR SELECT USING (true);
          CREATE POLICY "Allow authenticated insert" ON public.products FOR INSERT WITH CHECK (true);
          CREATE POLICY "Allow authenticated update" ON public.products FOR UPDATE USING (true);
          CREATE POLICY "Allow authenticated delete" ON public.products FOR DELETE USING (true);
        `);

        console.log("After running the SQL, run this script again.");
        return;
      }

      console.log("Products table exists!");
    } catch (error) {
      console.error("Error checking if products table exists:", error);
      return;
    }

    // ------ SETUP TRANSACTIONS TABLE ------
    console.log("\nSetting up transactions table...");

    // Check if transactions table exists
    try {
      const { error } = await supabase
        .from("transactions")
        .select("count")
        .limit(1);

      if (error) {
        console.error("Error checking transactions table:", error);
        console.log(
          "Transactions table likely does not exist. Please run the following SQL in Supabase SQL Editor:"
        );
        console.log(`
          CREATE TABLE IF NOT EXISTS public.transactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            transaction_date TIMESTAMPTZ DEFAULT NOW(),
            total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
            discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
            user_id UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          -- For RLS policies
          ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Allow public access" ON public.transactions FOR SELECT USING (true);
          CREATE POLICY "Allow authenticated insert" ON public.transactions FOR INSERT WITH CHECK (true);
        `);

        console.log("After running the SQL, run this script again.");
        return;
      }

      console.log("Transactions table exists!");
    } catch (error) {
      console.error("Error checking if transactions table exists:", error);
      return;
    }

    // ------ SETUP TRANSACTION_ITEMS TABLE ------
    console.log("\nSetting up transaction items table...");

    // Check if transaction_items table exists
    try {
      const { error } = await supabase
        .from("transaction_items")
        .select("count")
        .limit(1);

      if (error) {
        console.error("Error checking transaction_items table:", error);
        console.log(
          "Transaction items table likely does not exist. Please run the following SQL in Supabase SQL Editor:"
        );
        console.log(`
          CREATE TABLE IF NOT EXISTS public.transaction_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
            product_id UUID REFERENCES public.products(id),
            product_name TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            price DECIMAL(12, 2) NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          -- For RLS policies
          ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Allow public access" ON public.transaction_items FOR SELECT USING (true);
          CREATE POLICY "Allow authenticated insert" ON public.transaction_items FOR INSERT WITH CHECK (true);
        `);

        console.log("After running the SQL, run this script again.");
        return;
      }

      console.log("Transaction items table exists!");
    } catch (error) {
      console.error("Error checking if transaction_items table exists:", error);
      return;
    }

    console.log(
      "\nDatabase setup complete! You can now use your application with Supabase."
    );
    console.log("Default login: username=admin, password=password123");
  } catch (error) {
    console.error("Database setup failed:", error);
  }
}

// Run the setup
setupDatabase();
