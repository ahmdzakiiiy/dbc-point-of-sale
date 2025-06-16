import { supabase } from "../lib/supabase";

async function testConnection() {
  console.log("Testing Supabase connection...");

  try {
    // Get all tables in the database
    const { data, error } = await supabase.from("users").select("*").limit(1);

    if (error) {
      console.error("Error connecting to Supabase:", error);
      return;
    }

    console.log("Successfully connected to Supabase!");
    console.log("Users table exists with data:", data);

    // List all tables (requires additional permissions)
    try {
      const { data: tables, error: tablesError } = await supabase.rpc(
        "list_tables"
      );

      if (tablesError) {
        console.log(
          "Could not list tables (might need additional permissions):",
          tablesError
        );
      } else {
        console.log("Available tables:", tables);
      }
    } catch (e) {
      console.log(
        "Could not list tables, this is expected if RPC is not enabled"
      );
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testConnection();
