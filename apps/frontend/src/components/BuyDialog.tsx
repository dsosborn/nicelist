"use client";

import { Dialog } from "radix-ui";
import * as stylex from "@stylexjs/stylex";
import { app } from "@/app/appStyles";
import type { ShopperGift } from "@/lib/api";

export function giftTitle(gift: { title: string | null; url: string | null }) {
  return gift.title || gift.url || "Gift";
}

export function BuyDialog({
  gift,
  note,
  setNote,
  onAnswer,
  onClose,
}: {
  gift: ShopperGift;
  note: string;
  setNote: (value: string) => void;
  onAnswer: (bought: boolean) => void;
  onClose: () => void;
}) {
  const link = gift.url;
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay {...stylex.props(app.overlay)} />
        <Dialog.Content {...stylex.props(app.dialog)}>
          <Dialog.Title>Did you buy it?</Dialog.Title>
          <Dialog.Description>
            {giftTitle(gift)} stays reserved until you answer.
          </Dialog.Description>
          <label htmlFor="shopper-note">Note for other shoppers</label>
          <input
            id="shopper-note"
            placeholder="getting the blue one"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            {...stylex.props(app.input)}
          />
          <div {...stylex.props(app.row)}>
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                {...stylex.props(app.button)}
              >
                Buy
              </a>
            ) : null}
            <button
              type="button"
              {...stylex.props(app.button)}
              onClick={() => onAnswer(true)}
            >
              Yes
            </button>
            <Dialog.Close asChild>
              <button type="button" {...stylex.props(app.quiet)}>
                Not yet
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
