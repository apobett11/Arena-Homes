"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Arena Web] Route error boundary caught:", error);
  }, [error]);

  const missingSupabaseConfig =
    error.message.includes("NEXT_PUBLIC_SUPABASE_URL") ||
    error.message.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return (
    <div style={{ padding: "2rem", maxWidth: "720px", margin: "0 auto" }}>
      <h2>Something went wrong</h2>
      <p>
        {missingSupabaseConfig
          ? "Supabase config is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment."
          : "The application could not reach required services. Please retry in a moment."}
      </p>
      <button onClick={() => reset()} style={{ marginTop: "1rem" }}>
        Try again
      </button>
    </div>
  );
}
