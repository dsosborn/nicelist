"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { useAuth } from "@/hooks/useAuth";
import { authStyles as styles } from "../authStyles";
import { GoogleSignInButton } from "../GoogleSignInButton";
import { EmailNotConfirmedError } from "@/context/AuthContext";
import { consumeReturnTo } from "@/lib/returnTo";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirected = useRef(false);

  function goToReturnPath() {
    if (redirected.current) return;
    redirected.current = true;
    window.location.assign(consumeReturnTo());
  }

  useEffect(() => {
    if (!loading && user) {
      goToReturnPath();
    }
  }, [user, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      goToReturnPath();
    } catch (err) {
      if (err instanceof EmailNotConfirmedError) {
        router.replace(`/confirm?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(
        err instanceof Error ? err.message : "Sign in failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1 {...stylex.props(styles.title)}>Sign in</h1>
      <GoogleSignInButton />
      <form onSubmit={handleSubmit} {...stylex.props(styles.form)}>
        {error && <p role="alert" {...stylex.props(styles.error)}>{error}</p>}
        <label {...stylex.props(styles.label)} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          {...stylex.props(styles.input)}
        />
        <label {...stylex.props(styles.label)} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          {...stylex.props(styles.input)}
        />
        <Link href="/forgot-password" {...stylex.props(styles.link)}>
          Forgot password?
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          {...stylex.props(styles.button)}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p {...stylex.props(styles.footer)}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" {...stylex.props(styles.link)}>
          Sign up
        </Link>
      </p>
    </>
  );
}
