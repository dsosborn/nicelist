"use client";

import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import { useAuth } from "@/hooks/useAuth";
import { homeStyles } from "./homeStyles";

export function HomeClient() {
  const { user, loading } = useAuth();

  if (loading) {
    return <span {...stylex.props(homeStyles.cta)}>Loading…</span>;
  }

  if (user) {
    return (
      <Link
        href="/list"
        {...stylex.props(homeStyles.cta, homeStyles.primary)}
      >
        Your list
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" {...stylex.props(homeStyles.cta, homeStyles.primary)}>
        Sign in
      </Link>
      <Link
        href="/signup"
        {...stylex.props(homeStyles.cta, homeStyles.secondary)}
      >
        Sign up
      </Link>
    </>
  );
}
