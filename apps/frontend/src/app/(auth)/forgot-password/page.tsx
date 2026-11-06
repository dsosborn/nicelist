"use client";

import { useState } from "react";
import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import { useAuth } from "@/hooks/useAuth";
import { authStyles as styles } from "../authStyles";

export default function ForgotPasswordPage() {
  const { resetPassword, confirmResetPassword } = useAuth();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setStep("reset");
      setSuccess("Check your email for the reset code.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset code."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await confirmResetPassword(email, code, newPassword);
      setSuccess("Password reset! You can now sign in.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset password."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "request") {
    return (
      <>
        <h1 {...stylex.props(styles.title)}>Forgot password</h1>
        <form onSubmit={handleRequestCode} {...stylex.props(styles.form)}>
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
          <button
            type="submit"
            disabled={isSubmitting}
            {...stylex.props(styles.button)}
          >
            {isSubmitting ? "Sending…" : "Send reset code"}
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <h1 {...stylex.props(styles.title)}>Reset password</h1>
      <form onSubmit={handleResetPassword} {...stylex.props(styles.form)}>
        {success && <p {...stylex.props(styles.success)}>{success}</p>}
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
        <label {...stylex.props(styles.label)} htmlFor="code">
          Reset code
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          autoComplete="one-time-code"
          placeholder="Enter code from email"
          {...stylex.props(styles.input)}
        />
        <label {...stylex.props(styles.label)} htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
          {...stylex.props(styles.input)}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          {...stylex.props(styles.button)}
        >
          {isSubmitting ? "Resetting…" : "Reset password"}
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
