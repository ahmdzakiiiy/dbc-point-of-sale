import { supabase } from "../lib/supabase";

async function checkAdminUser() {
  console.log("Checking for admin user in database...");

  try {
    // Query the admin user
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", "admin")
      .maybeSingle();

    if (error) {
      console.error("Error querying admin user:", error);
      return;
    }

    if (data) {
      console.log("Admin user found:");
      console.log("ID:", data.id);
      console.log("Username:", data.username);
      console.log("Created at:", data.created_at);
    } else {
      console.log("Admin user not found in the database");
    }
  } catch (error) {
    console.error("Check failed:", error);
  }
}

checkAdminUser();
