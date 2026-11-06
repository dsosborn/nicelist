import * as stylex from "@stylexjs/stylex";
import { colors } from "@/styles/tokens.stylex";

export const authStyles = stylex.create({
  shell: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
  },
  panel: {
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 600,
    marginBottom: "1.5rem",
    color: colors.foreground,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: colors.foreground,
  },
  input: {
    paddingBlock: "0.75rem",
    paddingInline: "1rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: {
      default: "rgba(0, 0, 0, 0.2)",
      ":focus": "#2563eb",
    },
    borderRadius: 8,
    fontSize: "1rem",
    backgroundColor: colors.background,
    color: colors.foreground,
    outline: {
      default: null,
      ":focus": "none",
    },
    boxShadow: {
      default: null,
      ":focus": "0 0 0 2px rgba(37, 99, 235, 0.2)",
    },
    "::placeholder": {
      color: "#6b7280",
    },
  },
  error: {
    padding: "0.75rem",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    borderRadius: 8,
    fontSize: "0.875rem",
  },
  link: {
    fontSize: "0.875rem",
    color: "#2563eb",
    textDecoration: {
      default: "none",
      ":hover": "underline",
    },
  },
  googleButton: {
    width: "100%",
    paddingBlock: "0.75rem",
    paddingInline: "1rem",
    backgroundColor: colors.background,
    color: colors.foreground,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 8,
    fontSize: "1rem",
    fontWeight: 500,
    cursor: {
      default: "pointer",
      ":disabled": "not-allowed",
    },
    opacity: {
      default: 1,
      ":disabled": 0.6,
    },
  },
  divider: {
    marginTop: "1rem",
    marginBottom: "0.25rem",
    fontSize: "0.875rem",
    color: colors.foreground,
    opacity: 0.6,
    textAlign: "center",
  },
  button: {
    marginTop: "0.5rem",
    paddingBlock: "0.75rem",
    paddingInline: "1rem",
    backgroundColor: colors.foreground,
    color: colors.background,
    borderWidth: 0,
    borderStyle: "none",
    borderRadius: 8,
    fontSize: "1rem",
    fontWeight: 500,
    cursor: {
      default: "pointer",
      ":disabled": "not-allowed",
    },
    transitionProperty: "opacity",
    transitionDuration: "0.2s",
    opacity: {
      default: 1,
      ":hover:not(:disabled)": 0.9,
      ":disabled": 0.6,
    },
  },
  footer: {
    marginTop: "1.5rem",
    fontSize: "0.875rem",
    color: colors.foreground,
    opacity: 0.8,
  },
  hint: {
    marginBottom: "1rem",
  },
  success: {
    padding: "0.75rem",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    borderRadius: 8,
    fontSize: "0.875rem",
  },
});
