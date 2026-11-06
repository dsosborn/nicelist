"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { useAuth } from "@/hooks/useAuth";
import { authStyles as styles } from "../authStyles";
import { GoogleSignInButton } from "../GoogleSignInButton";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signUp(email, password);
      router.push(`/confirm?email=${encodeURIComponent(email)}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sign up failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1 {...stylex.props(styles.title)}>Create an account</h1>
      <GoogleSignInButton />
      <form onSubmit={handleSubmit} {...stylex.props(styles.form)}>
        {error && <p {...stylex.props(styles.error)}>{error}</p>}
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
          autoComplete="new-password"
          minLength={8}
          {...stylex.props(styles.input)}
          placeholder="At least 8 characters, with uppercase and numbers"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          {...stylex.props(styles.button)}
        >
          {isSubmitting ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p {...stylex.props(styles.footer)}>
        Already have an account?{" "}
        <Link href="/login" {...stylex.props(styles.link)}>
          Sign in
        </Link>
      </p>
    </>
  );
}
