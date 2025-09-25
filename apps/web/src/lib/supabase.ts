import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function signIn(email: string) {
  return supabase.auth.signInWithOtp({ email });
}

export async function signOut() { 
  return supabase.auth.signOut(); 
}