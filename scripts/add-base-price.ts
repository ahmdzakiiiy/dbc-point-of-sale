// Add base_price column to products table
import { supabase } from "../lib/supabase";
import fs from "fs";
import path from "path";

async function addBasePriceColumn() {
  try {
    console.log("Adding base_price column to products table...");
    
    // Read SQL file
    const sqlFilePath = path.join(process.cwd(), "scripts", "add-base-price-column.sql");
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8");
    
    // Execute SQL
    const { error } = await supabase.rpc("exec_sql", { query: sqlQuery });
    
    if (error) {
      console.error("Error adding base_price column:", error);
      return;
    }
    
    console.log("✅ base_price column added successfully!");
    
    // Verify the column exists by querying a product
    const { data, error: queryError } = await supabase
      .from("products")
      .select("id, name, price, base_price")
      .limit(1);
    
    if (queryError) {
      console.error("Error verifying column:", queryError);
      return;
    }
    
    console.log("Sample product with base_price:", data);
    console.log("✅ Column verification completed!");
    
  } catch (err) {
    console.error("Failed to add base_price column:", err);
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
