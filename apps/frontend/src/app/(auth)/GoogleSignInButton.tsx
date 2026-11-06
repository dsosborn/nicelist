"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { useAuth } from "@/hooks/useAuth";
import { authStyles as styles } from "./authStyles";
import { consumeReturnTo } from "@/lib/returnTo";

export function GoogleSignInButton() {
  const router = useRouter();
  const { user, signInWithGoogle, redirectError } = useAuth();
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!user) return;
    router.replace(consumeReturnTo());
  }, [user, router]);

  async function handleClick() {
    setError("");
    setIsRedirecting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Google sign-in failed. Please try again."
      );
      setIsRedirecting(false);
    }
  }

  const message = error || redirectError;

  return (
    <>
      {message && <p {...stylex.props(styles.error)}>{message}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={isRedirecting}
        {...stylex.props(styles.googleButton)}
      >
        {isRedirecting ? "Redirecting…" : "Continue with Google"}
      </button>
      <p {...stylex.props(styles.divider)}>or</p>
    </>
  );
}
