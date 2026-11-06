import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import * as stylex from "@stylexjs/stylex";
import { AgentTools } from "@/components/AgentTools";
import { AuthProvider } from "@/context/AuthContext";
import { colors } from "@/styles/tokens.stylex";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const styles = stylex.create({
  html: {
    colorScheme: {
      default: "light",
      "@media (prefers-color-scheme: dark)": "dark",
    },
  },
  body: {
    color: colors.foreground,
    backgroundColor: colors.background,
    fontFamily: "Arial, Helvetica, sans-serif",
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
  },
});

export const metadata: Metadata = {
  title: "Nicelist",
  description: "Nicelist 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const html = stylex.props(styles.html);
  const body = stylex.props(styles.body);

  return (
    <html lang="en" className={html.className} style={html.style}>
      <body
        className={`${geistSans.variable} ${geistMono.variable}${
          body.className ? ` ${body.className}` : ""
        }`}
        style={body.style}
      >
        <AuthProvider>
          <Suspense fallback={null}>
            <AgentTools />
          </Suspense>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
