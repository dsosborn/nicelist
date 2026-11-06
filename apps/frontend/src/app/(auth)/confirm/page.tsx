"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { useAuth } from "@/hooks/useAuth";
import { authStyles as styles } from "../authStyles";

function ConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const { confirmSignUp, resendCode } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Email is required. Please start from the sign-up page.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await confirmSignUp(email, code);
      router.replace("/login?confirmed=1");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Verification failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!email) {
    return (
      <>
        <h1 {...stylex.props(styles.title)}>Verify your email</h1>
        <p {...stylex.props(styles.footer)}>
          Missing email. Please{" "}
          <Link href="/signup" {...stylex.props(styles.link)}>
            sign up
          </Link>{" "}
          first.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 {...stylex.props(styles.title)}>Verify your email</h1>
      <p {...stylex.props(styles.footer, styles.hint)}>
        We sent a verification code to <strong>{email}</strong>
      </p>
      <form onSubmit={handleSubmit} {...stylex.props(styles.form)}>
        {error && <p {...stylex.props(styles.error)}>{error}</p>}
        <label {...stylex.props(styles.label)} htmlFor="code">
          Verification code
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          autoComplete="one-time-code"
          placeholder="Enter 6-digit code"
          {...stylex.props(styles.input)}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          {...stylex.props(styles.button)}
        >
          {isSubmitting ? "Verifying…" : "Verify"}
        </button>
        <button
          type="button"
          {...stylex.props(styles.button)}
          onClick={async () => {
            try {
              await resendCode(email);
              setError("");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not resend the code.");
            }
          }}
        >
          Resend code
        </button>
      </form>
      <p {...stylex.props(styles.footer)}>
        <Link href="/login" {...stylex.props(styles.link)}>
          Back to sign in
        </Link>
      </p>
    </>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <ConfirmForm />
    </Suspense>
  );
}
