// Alternative method to add base_price column to products table
import { supabase } from "../lib/supabase";

async function addBasePriceColumn() {
  try {
    console.log("Adding base_price column to products table...");
    
    // Check if column exists
    const { data: columns, error: columnError } = await supabase
      .from('products')
      .select()
      .limit(1);
    
    if (columnError) {
      console.error("Error checking products table:", columnError);
      return;
    }
    
    // Check if column exists in the first row
    const firstProduct = columns?.[0];
    if (!firstProduct) {
      console.log("No products found. Will attempt to add column anyway.");
    } else if ('base_price' in firstProduct) {
      console.log("✅ base_price column already exists!");
      return;
    }
    
    // We can't directly execute ALTER TABLE statements with Supabase client
    // So we'll use the REST API to execute the schema migration
    
    console.log("Please run the following SQL in your Supabase SQL editor:");
    console.log(`
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS base_price DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Update existing products to have the same base_price as price if they don't already have one
UPDATE public.products 
SET base_price = price 
WHERE base_price IS NULL OR base_price = 0;

-- Add comment
COMMENT ON COLUMN public.products.base_price IS 'Harga modal (purchase/cost price)';
    `);
    
    console.log("\nAfter executing the SQL, please restart your application.");
    console.log("The base_price column should now be available for use.");
    
  } catch (err) {
    console.error("Failed to check base_price column:", err);
  }
}

// Run the function
addBasePriceColumn()
  .then(() => {
    console.log("Script completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  });
