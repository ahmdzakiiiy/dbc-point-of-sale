import { supabase } from "../lib/supabase";
import fs from "fs";
import path from "path";

async function executeSQL() {
  console.log("Creating tables in Supabase...");

  try {
    const sqlFilePath = path.join(__dirname, "create-tables.sql");
    const sqlCommands = fs.readFileSync(sqlFilePath, "utf8");

    // Split the SQL by semicolons to execute each command separately
    // Skip empty statements
    const commands = sqlCommands
      .split(";")
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0);

    console.log(`Found ${commands.length} SQL commands to execute...`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      // Skip comments-only commands
      if (command.startsWith("--")) {
        continue;
      }

      console.log(`Executing command ${i + 1}/${commands.length}:`);
      console.log(
        command.substring(0, 50) + (command.length > 50 ? "..." : "")
      );

      const { error } = await supabase.rpc("exec_sql", { query: command });

      if (error) {
        console.error(`Error executing command ${i + 1}:`, error);

        // For certain errors, we might want to continue anyway
        if (error.message?.includes("already exists")) {
          console.log(
            'This appears to be an "already exists" error, continuing...'
          );
          continue;
        } else {
          console.log(
            "SQL execution failed. You may need to run the SQL manually."
          );
          console.log(
            "Please run the SQL commands in create-tables.sql manually in the Supabase SQL Editor."
          );
          break;
        }
      } else {
        console.log("Command executed successfully!");
      }
    }

    console.log("\nTable creation process complete!");
    console.log("To verify, run: npm run check-tables");
  } catch (error) {
    console.error("Error executing SQL:", error);
    console.log(
      "It looks like your Supabase instance does not support direct SQL execution via the client."
    );
    console.log(
      "Please run the SQL commands in create-tables.sql manually in the Supabase SQL Editor."
    );
  }
}

// Run the SQL execution
executeSQL();
