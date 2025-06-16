import { supabase } from "../lib/supabase";

// Important: This script only verifies table existence and doesn't create tables
// If tables don't exist, copy the SQL from instructions.md and run it in Supabase SQL Editor

async function verifyTables() {
  console.log("Verifying Supabase tables...");
  console.log(
    "URL:",
    process.env.NEXT_PUBLIC_SUPABASE_URL || "Using fallback URL"
  );

  const requiredTables = [
    "users",
    "products",
    "transactions",
    "transaction_items",
  ];
  const missingTables = [];

  console.log("\nChecking each table:");

  for (const table of requiredTables) {
    try {
      console.log(`\nChecking table '${table}'...`);

      // First approach: Try to select a single column
      const { data, error } = await supabase.from(table).select("id").limit(1);

      if (error) {
        console.error(`Error checking ${table} table:`, error.message);

        // For '42P01' error code, the table doesn't exist
        if (error.code === "42P01") {
          console.log(`❌ Table '${table}' does not exist in the database.`);
          missingTables.push(table);
        } else {
          console.log(
            `⚠️ Table '${table}' may exist but there are access issues.`
          );
        }
      } else {
        console.log(`✅ Table '${table}' exists and is accessible.`);
        console.log(`   Found ${data?.length || 0} sample rows.`);
      }
    } catch (error) {
      console.error(`Unexpected error checking ${table}:`, error);
      missingTables.push(table);
    }
  }

  // Summary
  console.log("\n===== VERIFICATION SUMMARY =====");
  if (missingTables.length === 0) {
    console.log("✅ ALL TABLES EXIST! Your database is ready to use.");
  } else {
    console.log(
      `❌ ${missingTables.length} MISSING TABLES: ${missingTables.join(", ")}`
    );
    console.log(
      "\nPlease go to the Supabase dashboard SQL Editor and run the SQL commands"
    );
    console.log(
      "provided in the scripts/create-tables.sql file for the missing tables."
    );
    console.log(
      "\nOnce you've created the tables, run this verification script again"
    );
    console.log("to ensure all tables are properly set up.");
  }
}

verifyTables();
