"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Collapsible } from "radix-ui";
import * as stylex from "@stylexjs/stylex";
import { useAuth } from "@/hooks/useAuth";
import { app } from "@/app/appStyles";
import { fetchMe, updateProfile } from "@/lib/api";
import { clearReturnTo } from "@/lib/returnTo";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMe()
      .then((me) => setDisplayName(me.displayName))
      .catch(() => {});
  }, [user]);

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
        <div {...stylex.props(app.row, app.spacer)}>
          <Collapsible.Root open={open} onOpenChange={setOpen}>
            <Collapsible.Trigger asChild>
              <button type="button" {...stylex.props(app.quiet)}>
                {displayName ? `Name: ${displayName}` : "Your name"}
              </button>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <form
                {...stylex.props(app.row)}
                onSubmit={async (event) => {
                  event.preventDefault();
                  const next = await updateProfile(displayName);
                  setDisplayName(next.displayName);
                  setOpen(false);
                }}
              >
                <input
                  aria-label="Your display name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  {...stylex.props(app.input)}
                />
                <button type="submit" {...stylex.props(app.button)}>
                  Save
                </button>
              </form>
            </Collapsible.Content>
          </Collapsible.Root>
          <button
            type="button"
            {...stylex.props(app.quiet)}
            onClick={async () => {
              await signOut();
              clearReturnTo();
              window.location.assign("/");
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </header>
  );
}
