"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <>
      return (
      <div>
        <h1>Knockit</h1>
        <button onClick={handleLogin}>Google でログイン</button>
      </div>
      );
    </>
  );
}
