"use client";

import { useState } from "react";
import { Collapsible } from "radix-ui";
import * as stylex from "@stylexjs/stylex";
import { app } from "@/app/appStyles";
import { MembershipRadio, TimingRadio } from "@/components/PhraseRadio";
import type {
  GiftInput,
  GiftKind,
  MembershipPhrase,
  TimingPhrase,
} from "@/lib/api";

const kinds: { id: GiftKind; label: string }[] = [
  { id: "PRODUCT", label: "Product link" },
  { id: "CUSTOM", label: "Custom gift" },
  { id: "EXPERIENCE", label: "Experience" },
  { id: "MEMBERSHIP", label: "Membership" },
];

export function GiftForm({
  onAdd,
  submitLabel = "Add gift",
  allowQuantity = true,
  initialKind = "PRODUCT",
}: {
  onAdd: (input: GiftInput) => Promise<void>;
  submitLabel?: string;
  allowQuantity?: boolean;
  initialKind?: GiftKind;
}) {
  const [kind, setKind] = useState<GiftKind>(initialKind);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showQuantity, setShowQuantity] = useState(false);
  const [timing, setTiming] = useState<TimingPhrase>("ANYTIME");
  const [membership, setMembership] = useState<MembershipPhrase>("ANNUAL");
  const [error, setError] = useState("");
  const errorId = "gift-form-error";

  return (
    <form
      {...stylex.props(app.card)}
      aria-describedby={error ? errorId : undefined}
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        const trimmedUrl = url.trim();
        const trimmedTitle = title.trim();
        if (kind === "PRODUCT" && !trimmedUrl) {
          setError("A product needs a link.");
          return;
        }
        if (kind !== "PRODUCT" && !trimmedTitle) {
          setError("A title is required.");
          return;
        }
        if (allowQuantity && quantity < 1) {
          setError("Quantity must be at least 1.");
          return;
        }
        try {
          await onAdd({
            kind,
            title: trimmedTitle,
            url: trimmedUrl,
            notes: notes.trim(),
            quantity: allowQuantity ? quantity : 1,
            price: price ? Math.round(Number(price) * 100) : null,
            timingPhrase: kind === "EXPERIENCE" ? timing : null,
            membershipPhrase: kind === "MEMBERSHIP" ? membership : null,
          });
          setTitle("");
          setUrl("");
          setNotes("");
          setPrice("");
          setQuantity(1);
          setShowQuantity(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not add that gift.");
        }
      }}
    >
      <div {...stylex.props(app.row)} role="group" aria-label="Gift type">
        {kinds.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={kind === item.id}
            {...stylex.props(kind === item.id ? app.button : app.quiet)}
            onClick={() => {
              setKind(item.id);
              setError("");
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {kind === "PRODUCT" ? (
        <input
          aria-label="Product link"
          aria-describedby={error ? errorId : undefined}
          placeholder="Paste a product link"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          {...stylex.props(app.input)}
        />
      ) : (
        <input
          aria-label="Title"
          aria-describedby={error ? errorId : undefined}
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          {...stylex.props(app.input)}
        />
      )}
      {kind === "EXPERIENCE" ? (
        <TimingRadio value={timing} onChange={setTiming} />
      ) : null}
      {kind === "MEMBERSHIP" ? (
        <MembershipRadio value={membership} onChange={setMembership} />
      ) : null}
      <Collapsible.Root>
        <Collapsible.Trigger asChild>
          <button type="button" {...stylex.props(app.quiet)}>
            More details
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content {...stylex.props(app.stack)}>
          {kind === "PRODUCT" ? (
            <input
              aria-label="Title"
              placeholder="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              {...stylex.props(app.input)}
            />
          ) : (
            <input
              aria-label="Link"
              placeholder="Optional link"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              {...stylex.props(app.input)}
            />
          )}
          <input
            aria-label="Notes"
            placeholder="Notes, such as size or which shop"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            {...stylex.props(app.input)}
          />
          <input
            aria-label="Price"
            placeholder="Price"
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            {...stylex.props(app.input)}
          />
          {allowQuantity ? (
            showQuantity || quantity !== 1 ? (
              <label {...stylex.props(app.row)}>
                <span>Quantity</span>
                <input
                  aria-label="Quantity"
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  {...stylex.props(app.input)}
                />
              </label>
            ) : (
              <button
                type="button"
                {...stylex.props(app.quiet)}
                onClick={() => setShowQuantity(true)}
              >
                Change quantity (1)
              </button>
            )
          ) : null}
        </Collapsible.Content>
      </Collapsible.Root>
      {error ? (
        <p id={errorId} role="alert" {...stylex.props(app.error)}>
          {error}
        </p>
      ) : null}
      <button type="submit" {...stylex.props(app.button)}>
        {submitLabel}
      </button>
    </form>
  );
}
