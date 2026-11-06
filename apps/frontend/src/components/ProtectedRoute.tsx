"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { useAuth } from "@/hooks/useAuth";
import { rememberReturnTo } from "@/lib/returnTo";

const styles = stylex.create({
  loading: {
    padding: "2rem",
    textAlign: "center",
  },
});

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (pathname) rememberReturnTo(pathname);
      router.replace("/login");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <div {...stylex.props(styles.loading)}>Loading…</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
