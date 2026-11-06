import { useEffect, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import {
  readProductFromDocument,
  type ProductPageFields,
} from "../content/readProduct";
import {
  addProductGiftFromExtension,
  fetchOwnerLists,
  isExtensionSignedIn,
  signInWithGoogleInExtension,
  signInWithPassword,
  signOutFromExtension,
  type OwnerListOption,
} from "./client";

const styles = stylex.create({
  shell: {
    width: 340,
    padding: "1rem",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    color: { default: "#18181b", "@media (prefers-color-scheme: dark)": "#f4f4f5" },
    backgroundColor: {
      default: "#ffffff",
      "@media (prefers-color-scheme: dark)": "#09090b",
    },
  },
  row: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: "1.125rem", fontWeight: 700, margin: 0 },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    fontSize: "0.875rem",
  },
  input: {
    minHeight: 38,
    padding: "0.45rem 0.65rem",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#71717a",
    fontSize: "0.95rem",
    backgroundColor: "transparent",
    color: "inherit",
  },
  button: {
    minHeight: 40,
    padding: "0.5rem 0.85rem",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#18181b",
    backgroundColor: "#18181b",
    color: "#fafafa",
    fontSize: "0.95rem",
    cursor: "pointer",
  },
  quiet: {
    minHeight: 36,
    padding: "0.4rem 0.7rem",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#71717a",
    backgroundColor: "transparent",
    color: "inherit",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  error: { color: "#b91c1c", fontSize: "0.875rem", margin: 0 },
  saved: { color: "#166534", fontSize: "0.875rem", margin: 0 },
});

async function readActiveTabProduct(): Promise<ProductPageFields> {
  if (typeof chrome !== "undefined" && chrome.tabs?.query && chrome.scripting?.executeScript) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && tab.url && /^https?:\/\//i.test(tab.url)) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            html: document.documentElement.outerHTML,
            href: window.location.href,
          };
        },
      });
      const first = results?.[0]?.result;
      if (first?.html && first?.href) {
        const doc = new DOMParser().parseFromString(first.html, "text/html");
        return readProductFromDocument(doc, first.href);
      }
    }
  }
  return readProductFromDocument(document, window.location.href);
}

export function PopupApp() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [lists, setLists] = useState<OwnerListOption[]>([]);
  const [listId, setListId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function loadOwnerView() {
    const [ownerLists, product] = await Promise.all([
      fetchOwnerLists(),
      readActiveTabProduct(),
    ]);
    setLists(ownerLists);
    if (ownerLists[0]) setListId(ownerLists[0].id);
    setTitle(product.title);
    setUrl(product.url);
    setPrice(
      product.priceCents != null ? (product.priceCents / 100).toFixed(2) : "",
    );
    setNotes(product.variantNote);
  }

  useEffect(() => {
    isExtensionSignedIn()
      .then(async (ok) => {
        setSignedIn(ok);
        if (ok) await loadOwnerView();
      })
      .catch(() => setSignedIn(false));
  }, []);

  if (signedIn === null) {
    return (
      <main {...stylex.props(styles.shell)}>
        <p>Loading…</p>
      </main>
    );
  }

  if (!signedIn) {
    return (
      <main {...stylex.props(styles.shell)}>
        <h1 {...stylex.props(styles.title)}>Sign in to Nicelist</h1>
        <button
          type="button"
          {...stylex.props(styles.quiet)}
          onClick={async () => {
            setError("");
            try {
              await signInWithGoogleInExtension();
              setSignedIn(true);
              await loadOwnerView();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Google sign-in failed.",
              );
            }
          }}
        >
          Continue with Google
        </button>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            try {
              await signInWithPassword(email, password);
              setSignedIn(true);
              await loadOwnerView();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Sign-in failed.");
            }
          }}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label {...stylex.props(styles.label)}>
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              {...stylex.props(styles.input)}
            />
          </label>
          <label {...stylex.props(styles.label)}>
            <span>Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              {...stylex.props(styles.input)}
            />
          </label>
          {error ? (
            <p role="alert" {...stylex.props(styles.error)}>
              {error}
            </p>
          ) : null}
          <button type="submit" {...stylex.props(styles.button)}>
            Sign in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main {...stylex.props(styles.shell)}>
      <div {...stylex.props(styles.row)}>
        <h1 {...stylex.props(styles.title)}>Add to Nicelist</h1>
        <button
          type="button"
          {...stylex.props(styles.quiet)}
          onClick={async () => {
            await signOutFromExtension();
            setSignedIn(false);
          }}
        >
          Sign out
        </button>
      </div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          setSaved(false);
          try {
            await addProductGiftFromExtension({
              listId,
              title: title.trim(),
              url: url.trim(),
              priceCents: price ? Math.round(Number(price) * 100) : null,
              notes: notes.trim(),
            });
            setSaved(true);
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Could not add that gift.",
            );
          }
        }}
        style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
      >
        <label {...stylex.props(styles.label)}>
          <span>List</span>
          <select
            aria-label="List"
            value={listId}
            onChange={(event) => setListId(event.target.value)}
            {...stylex.props(styles.input)}
          >
            {lists.map((item) => (
              <option key={item.id} value={item.id}>
                {item.recipientName}: {item.name}
              </option>
            ))}
          </select>
        </label>
        <label {...stylex.props(styles.label)}>
          <span>Title</span>
          <input
            aria-label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            {...stylex.props(styles.input)}
          />
        </label>
        <label {...stylex.props(styles.label)}>
          <span>Product link</span>
          <input
            aria-label="Product link"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            {...stylex.props(styles.input)}
          />
        </label>
        <label {...stylex.props(styles.label)}>
          <span>Price</span>
          <input
            aria-label="Price"
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            {...stylex.props(styles.input)}
          />
        </label>
        <label {...stylex.props(styles.label)}>
          <span>Notes (size, color, or variant)</span>
          <input
            aria-label="Notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            {...stylex.props(styles.input)}
          />
        </label>
        {error ? (
          <p role="alert" {...stylex.props(styles.error)}>
            {error}
          </p>
        ) : null}
        {saved ? (
          <p role="status" {...stylex.props(styles.saved)}>
            Added to your wishlist.
          </p>
        ) : null}
        <button type="submit" {...stylex.props(styles.button)}>
          Add gift
        </button>
      </form>
    </main>
  );
}
