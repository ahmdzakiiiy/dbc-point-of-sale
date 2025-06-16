import { createClient } from "@supabase/supabase-js";

// When running in Node.js scripts, process.env doesn't automatically load .env.local
// In next.js pages, these will be properly loaded
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://vlwewmldpgkmnqjphbzv.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsd2V3bWxkcGdrbW5xanBoYnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDcyMzUsImV4cCI6MjA2NTMyMzIzNX0.8pu5mOyVkPvSlaqk2K2RBny-gtkX5nhT7-szrc5R6yU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for users table
export type User = {
  id: string;
  username: string;
  password: string; // Note: In production, passwords should never be stored in plain text
  created_at?: string;
};
