"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { useAuth } from "@/hooks/useAuth";

const styles = stylex.create({
  loading: {
    padding: "2rem",
    textAlign: "center",
  },
});

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div {...stylex.props(styles.loading)}>Loading…</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
