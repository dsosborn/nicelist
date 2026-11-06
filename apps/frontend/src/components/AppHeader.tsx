"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { useAuth } from "@/hooks/useAuth";
import { app } from "@/app/appStyles";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <header {...stylex.props(app.header)}>
      <Link href={user ? "/list" : "/"} {...stylex.props(app.brand)}>
        Nicelist
      </Link>
      {user ? (
        <>
          <Link href="/list" {...stylex.props(app.navLink)}>
            Your list
          </Link>
          <Link href="/shopping" {...stylex.props(app.navLink)}>
            Shopping list
          </Link>
          <Link href="/friends" {...stylex.props(app.navLink)}>
            Friends
          </Link>
        </>
      ) : (
        <Link href="/login" {...stylex.props(app.navLink)}>
          Sign in
        </Link>
      )}
      <Link href="/privacy" {...stylex.props(app.navLink)}>
        Privacy
      </Link>
      {user ? (
        <button
          type="button"
          {...stylex.props(app.quiet, app.spacer)}
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
        >
          Sign out
        </button>
      ) : null}
    </header>
  );
}
