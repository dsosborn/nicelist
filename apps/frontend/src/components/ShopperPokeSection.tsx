"use client";

import * as stylex from "@stylexjs/stylex";
import { app } from "@/app/appStyles";
import {
  bandCopy,
  pokeList,
  type OwnerList,
  type Poke,
  type PriceBand,
} from "@/lib/api";

export function purchasedSummary(list: OwnerList) {
  const slots = list.gifts.flatMap((gift) => gift.slots ?? []);
  const bought = slots.filter((slot) => slot.status === "PURCHASED").length;
  return `${bought} of ${slots.length || list.gifts.length} were purchased`;
}

export function ShopperPokeSection({
  listId,
  recipientName,
  bands,
  myPokes,
  onPoked,
}: {
  listId: string;
  recipientName: string;
  bands: PriceBand[];
  myPokes: Poke[];
  onPoked: () => Promise<void>;
}) {
  return (
    <section {...stylex.props(app.card)}>
      {myPokes.map((poke) => (
        <p key={poke.id}>
          You poked {recipientName} for more ideas {bandCopy[poke.band]}
        </p>
      ))}
      <div {...stylex.props(app.row)}>
        {bands
          .filter((band) => !myPokes.some((poke) => poke.band === band))
          .map((band) => (
            <button
              key={band}
              type="button"
              {...stylex.props(app.quiet)}
              onClick={async () => {
                await pokeList(listId, band);
                await onPoked();
              }}
            >
              Poke for more ideas {bandCopy[band]}
            </button>
          ))}
      </div>
    </section>
  );
}
