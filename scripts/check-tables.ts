import { supabase } from "../lib/supabase";

async function checkTables() {
  console.log("Checking Supabase tables...");
  console.log(
    "Using Supabase URL:",
    process.env.NEXT_PUBLIC_SUPABASE_URL || "Fallback URL"
  );

  const tables = ["users", "products", "transactions", "transaction_items"];

  console.log("Testing authentication:");
  const auth = await supabase.auth.getSession();
  console.log("Authentication result:", auth.error ? "Error" : "Success");

  if (auth.error) {
    console.error("Auth error details:", auth.error);
  }

  console.log("\nChecking tables:");

  for (const table of tables) {
    try {
      console.log(`\nTesting '${table}' table...`);

      // Try a count query
      const { data: countData, error: countError } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (countError) {
        console.error(`Error accessing ${table} table:`, countError);

        // Try to get detailed Postgres error info
        if (countError.code) {
          console.log(`Error code: ${countError.code}`);
        }
        if (countError.message) {
          console.log(`Error message: ${countError.message}`);
        }

        if (countError.message?.includes("does not exist")) {
          console.log(`Table '${table}' does not exist in the database.`);
        } else {
          console.log(
            `Table '${table}' may exist but there are permission issues.`
          );
        }
      } else {
        console.log(`✅ Table '${table}' exists!`);
        console.log(`Count query successful`);

        // Try an actual select
        const { data, error } = await supabase.from(table).select("*").limit(1);

        if (error) {
          console.error(`Error selecting from ${table}:`, error);
        } else {
          console.log(`Data retrieved: ${data?.length || 0} rows`);
          if (data && data.length > 0) {
            console.log(
              `Sample data:`,
              JSON.stringify(data[0], null, 2).substring(0, 100) + "..."
            );
          }
        }
      }
    } catch (error) {
      console.error(`Unexpected error checking ${table} table:`, error);
    }
  }

  console.log("\n===== Diagnostics complete =====");
}

checkTables();
