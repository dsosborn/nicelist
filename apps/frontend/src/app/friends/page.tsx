"use client";

import { useEffect, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { AppHeader } from "@/components/AppHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { app } from "@/app/appStyles";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  fetchFriends,
  removeFriend,
  sendFriendRequest,
  type FriendsView,
} from "@/lib/api";

export default function FriendsPage() {
  return (
    <ProtectedRoute>
      <AppHeader />
      <FriendsBody />
    </ProtectedRoute>
  );
}

function FriendsBody() {
  const [view, setView] = useState<FriendsView | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFriends()
      .then(setView)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load friends."));
  }, []);

  if (error) return <main {...stylex.props(app.page)}><p {...stylex.props(app.error)}>{error}</p></main>;
  if (!view) return <main {...stylex.props(app.page)}><p>Loading…</p></main>;

  return (
    <main {...stylex.props(app.page)}>
      <h1 {...stylex.props(app.title)}>Friends</h1>
      <form
        {...stylex.props(app.row)}
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            setView(await sendFriendRequest(email));
            setEmail("");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not send that request.");
          }
        }}
      >
        <label htmlFor="friend-email">Email</label>
        <input id="friend-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required {...stylex.props(app.input)} />
        <button type="submit" {...stylex.props(app.button)}>Send request</button>
      </form>
      {error ? <p {...stylex.props(app.error)}>{error}</p> : null}
      <section>
        <h2>Requests for you</h2>
        {view.incoming.map((person) => (
          <div key={person.userId} {...stylex.props(app.row)}>
            <span>{person.displayName}</span>
            <button type="button" {...stylex.props(app.button)} onClick={async () => setView(await acceptFriendRequest(person.userId))}>Accept</button>
            <button type="button" {...stylex.props(app.quiet)} onClick={async () => setView(await declineFriendRequest(person.userId))}>Decline</button>
          </div>
        ))}
      </section>
      <section>
        <h2>Waiting</h2>
        {view.outgoing.map((person) => (
          <div key={person.userId} {...stylex.props(app.row)}>
            <span>{person.displayName}</span>
            <button type="button" {...stylex.props(app.quiet)} onClick={async () => setView(await cancelFriendRequest(person.userId))}>Cancel</button>
          </div>
        ))}
      </section>
      <section>
        <h2>Friends</h2>
        {view.friends.map((person) => (
          <div key={person.userId} {...stylex.props(app.row)}>
            <span>{person.displayName}</span>
            <ConfirmDialog
              title={`End your friendship with ${person.displayName}?`}
              description="Friends-only lists on both sides disappear for the other person."
              confirmLabel="Remove friend"
              onConfirm={async () => setView(await removeFriend(person.userId))}
            >
              <button type="button" {...stylex.props(app.quiet)}>Remove</button>
            </ConfirmDialog>
          </div>
        ))}
      </section>
    </main>
  );
}
