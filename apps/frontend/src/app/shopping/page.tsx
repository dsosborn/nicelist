"use client";

import { useEffect, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { AppHeader } from "@/components/AppHeader";
import { BuyDialog, giftTitle } from "@/components/BuyDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { GiftForm } from "@/components/GiftForm";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ShopperPokeSection } from "@/components/ShopperPokeSection";
import { app } from "@/app/appStyles";
import {
  addPlannedGift,
  addShoppingPerson,
  askForShoppingIdeas,
  deletePlannedGift,
  deleteShoppingList,
  dollars,
  fetchFriends,
  fetchMyLists,
  fetchShoppingList,
  fetchShoppingPerson,
  membershipCopy,
  releaseGift,
  removeShoppingPerson,
  renameShoppingList,
  reserveGift,
  setAgainNextYear,
  setPlannedPurchased,
  setPurchased,
  setStandingNote,
  thinBands,
  timingCopy,
  type FriendsView,
  type GiftIdea,
  type ListSummary,
  type Poke,
  type PriceBand,
  type ShopperGift,
  type ShoppingList,
} from "@/lib/api";

export default function ShoppingPage() {
  return (
    <ProtectedRoute>
      <AppHeader />
      <ShoppingBody />
    </ProtectedRoute>
  );
}

type PersonGiftState = {
  listId: string | null;
  gifts: ShopperGift[];
  myPokes: Poke[];
};

function ShoppingBody() {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [friends, setFriends] = useState<FriendsView | null>(null);
  const [children, setChildren] = useState<ListSummary[]>([]);
  const [gifts, setGifts] = useState<Record<string, PersonGiftState>>({});
  const [name, setName] = useState("");
  const [personName, setPersonName] = useState("");
  const [error, setError] = useState("");

  async function loadPeopleGifts(people: ShoppingList["people"]) {
    const entries = await Promise.all(
      people
        .filter((person) => person.refId)
        .map(async (person) => {
          const result = await fetchShoppingPerson(person.id);
          return [
            person.id,
            {
              listId: result?.listId ?? null,
              gifts: result?.gifts ?? [],
              myPokes: result?.myPokes ?? [],
            },
          ] as const;
        }),
    );
    return Object.fromEntries(entries);
  }

  async function reload() {
    const next = await fetchShoppingList();
    setList(next);
    setName(next.name);
    setGifts(await loadPeopleGifts(next.people));
  }

  useEffect(() => {
    Promise.all([fetchShoppingList(), fetchFriends(), fetchMyLists()])
      .then(async ([shopping, friendView, lists]) => {
        setList(shopping);
        setName(shopping.name);
        setFriends(friendView);
        setChildren(lists.filter((item) => item.isChild));
        setGifts(await loadPeopleGifts(shopping.people));
      })
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "Could not load the shopping list.",
        ),
      );
  }, []);

  if (error) {
    return (
      <main {...stylex.props(app.page)}>
        <p role="alert" {...stylex.props(app.error)}>{error}</p>
      </main>
    );
  }
  if (!list) {
    return (
      <main {...stylex.props(app.page)}>
        <p>Loading…</p>
      </main>
    );
  }

  const claimedWishlistCents = Object.values(gifts).reduce((sum, entry) => {
    return (
      sum +
      entry.gifts.reduce((giftSum, gift) => {
        const mineCount = gift.slots.filter(
          (slot) => slot.mine && slot.status !== "OPEN",
        ).length;
        return giftSum + (gift.price ?? 0) * mineCount;
      }, 0)
    );
  }, 0);
  const totalCents = list.totalCents + claimedWishlistCents;

  return (
    <main {...stylex.props(app.page)}>
      <h1 {...stylex.props(app.title)}>{list.name}</h1>
      <form
        {...stylex.props(app.row)}
        onSubmit={async (event) => {
          event.preventDefault();
          setList(await renameShoppingList(name));
        }}
      >
        <label htmlFor="shopping-name">Shopping list name</label>
        <input
          id="shopping-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          {...stylex.props(app.input)}
        />
        <button type="submit" {...stylex.props(app.quiet)}>
          Rename
        </button>
      </form>
      <p>Total {dollars(totalCents)}</p>
      <form
        {...stylex.props(app.row)}
        onSubmit={async (event) => {
          event.preventDefault();
          if (!personName.trim()) return;
          await addShoppingPerson(personName, "NAME");
          setPersonName("");
          await reload();
        }}
      >
        <input
          aria-label="Person with no account"
          placeholder="Add someone, such as Grandpa"
          value={personName}
          onChange={(event) => setPersonName(event.target.value)}
          {...stylex.props(app.input)}
        />
        <button type="submit" {...stylex.props(app.quiet)}>
          Add name
        </button>
      </form>
      <div {...stylex.props(app.row)}>
        {friends?.friends.map((friend) => (
          <button
            key={friend.userId}
            type="button"
            {...stylex.props(app.quiet)}
            onClick={async () => {
              await addShoppingPerson(
                friend.displayName,
                "FRIEND",
                friend.userId,
              );
              await reload();
            }}
          >
            Add {friend.displayName}
          </button>
        ))}
        {children.map((child) => (
          <button
            key={child.id}
            type="button"
            {...stylex.props(app.quiet)}
            onClick={async () => {
              await addShoppingPerson(
                child.recipientName,
                "CHILD",
                child.recipientId,
              );
              await reload();
            }}
          >
            Add {child.recipientName}
          </button>
        ))}
      </div>
      {list.people.map((person) => {
        const personGifts = gifts[person.id]?.gifts ?? [];
        const personListId = gifts[person.id]?.listId ?? null;
        const personPokes = gifts[person.id]?.myPokes ?? [];
        const planned = list.plannedGifts.filter(
          (gift) => gift.personId === person.id,
        );
        const bands = thinBands([
          ...personGifts.map((g) => g.price),
          ...planned.map((g) => g.price),
        ]);
        const wishlistBands = thinBands(personGifts.map((g) => g.price));
        return (
          <section key={person.id} {...stylex.props(app.card)}>
            <h2>{person.name}</h2>
            <form
              {...stylex.props(app.row)}
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                await setStandingNote(person.id, String(form.get("note") || ""));
                await reload();
              }}
            >
              <input
                name="note"
                aria-label={`Note for ${person.name}`}
                defaultValue={person.standingNote || ""}
                placeholder="Size, color to avoid, where to ship"
                {...stylex.props(app.input)}
              />
              <button type="submit" {...stylex.props(app.quiet)}>
                Save note
              </button>
            </form>
            <PersonGifts
              personId={person.id}
              listId={personListId || ""}
              gifts={personGifts}
              again={list.againClaimIds}
              onChange={reload}
            />
            {person.kind === "FRIEND" && personListId && wishlistBands.length > 0 ? (
              <ShopperPokeSection
                listId={personListId}
                recipientName={person.name}
                bands={wishlistBands}
                myPokes={personPokes}
                onPoked={reload}
              />
            ) : null}
            <PlannedGifts
              personId={person.id}
              gifts={planned}
              onChange={reload}
            />
            {bands.length > 0 ? (
              <ShoppingIdeas
                personId={person.id}
                bands={bands}
                onAdded={reload}
              />
            ) : null}
            <button
              type="button"
              {...stylex.props(app.quiet)}
              onClick={async () => {
                await removeShoppingPerson(person.id);
                await reload();
              }}
            >
              Remove {person.name}
            </button>
          </section>
        );
      })}
      <ConfirmDialog
        title="Delete this shopping list?"
        description="This removes the people and private planned gifts. It does not release wishlist claims."
        confirmLabel="Delete shopping list"
        onConfirm={async () => {
          await deleteShoppingList();
          await reload();
        }}
      >
        <button type="button" {...stylex.props(app.quiet)}>
          Delete shopping list
        </button>
      </ConfirmDialog>
    </main>
  );
}

function PersonGifts({
  personId,
  listId,
  gifts,
  again,
  onChange,
}: {
  personId: string;
  listId: string;
  gifts: ShopperGift[];
  again: string[];
  onChange: () => Promise<void>;
}) {
  const [pending, setPending] = useState<ShopperGift | null>(null);
  const [note, setNote] = useState("");
  return (
    <>
      {gifts.map((gift) =>
        gift.slots
          .filter((slot) => slot.status === "OPEN" || slot.mine)
          .map((slot) => (
            <div key={`${gift.id}-${slot.index}`} {...stylex.props(app.row)}>
              <span>
                {giftTitle(gift)}
                {gift.price != null ? ` · ${dollars(gift.price)}` : ""} ·{" "}
                {slot.status === "OPEN"
                  ? "Available"
                  : slot.status === "PURCHASED"
                    ? "Purchased"
                    : "Reserved"}
              </span>
              {slot.status === "OPEN" ? (
                <button
                  type="button"
                  {...stylex.props(app.button)}
                  onClick={async () => {
                    const updated = await reserveGift(listId, gift.id);
                    setPending(updated);
                    await onChange();
                  }}
                >
                  {"I'll get this"}
                </button>
              ) : null}
              {slot.mine && slot.status === "RESERVED" ? (
                <button
                  type="button"
                  {...stylex.props(app.button)}
                  onClick={() => setPending(gift)}
                >
                  Did you buy it?
                </button>
              ) : null}
              {slot.mine && slot.status === "PURCHASED" ? (
                <button
                  type="button"
                  {...stylex.props(app.quiet)}
                  onClick={async () => {
                    await setPurchased(listId, gift.id, slot.index, false);
                    await onChange();
                  }}
                >
                  Undo purchased
                </button>
              ) : null}
              {slot.mine && slot.status !== "OPEN" ? (
                <button
                  type="button"
                  {...stylex.props(app.quiet)}
                  onClick={async () => {
                    await releaseGift(listId, gift.id, slot.index);
                    await onChange();
                  }}
                >
                  Release
                </button>
              ) : null}
              {slot.mine && slot.status === "PURCHASED" && slot.claimId ? (
                <button
                  type="button"
                  {...stylex.props(app.quiet)}
                  onClick={async () => {
                    await setAgainNextYear(
                      slot.claimId || "",
                      personId,
                      !again.includes(slot.claimId || ""),
                    );
                    await onChange();
                  }}
                >
                  {again.includes(slot.claimId)
                    ? "Saved for next year"
                    : "Again next year"}
                </button>
              ) : null}
            </div>
          )),
      )}
      {pending ? (
        <BuyDialog
          gift={pending}
          note={note}
          setNote={setNote}
          onAnswer={async (bought) => {
            const slot =
              pending.slots.find(
                (item) => item.mine && item.status === "RESERVED",
              ) || pending.slots.find((item) => item.mine);
            if (!slot) return;
            await setPurchased(listId, pending.id, slot.index, bought, note);
            setNote("");
            setPending(null);
            await onChange();
          }}
          onClose={async () => {
            setPending(null);
            await onChange();
          }}
        />
      ) : null}
    </>
  );
}

function PlannedGifts({
  personId,
  gifts,
  onChange,
}: {
  personId: string;
  gifts: ShoppingList["plannedGifts"];
  onChange: () => Promise<void>;
}) {
  return (
    <div {...stylex.props(app.stack)}>
      {gifts.map((gift) => (
        <div key={gift.id} {...stylex.props(app.row)}>
          <span>
            {giftTitle(gift)}{" "}
            {gift.purchased ? "· purchased" : "· still to buy"}{" "}
            {gift.price != null ? dollars(gift.price) : ""}
            {gift.timingPhrase ? ` · ${timingCopy[gift.timingPhrase]}` : ""}
            {gift.membershipPhrase
              ? ` · ${membershipCopy[gift.membershipPhrase]}`
              : ""}
          </span>
          {gift.url ? (
            <a
              href={gift.url}
              target="_blank"
              rel="noreferrer"
              {...stylex.props(app.quiet)}
            >
              Buy
            </a>
          ) : null}
          <button
            type="button"
            {...stylex.props(app.quiet)}
            onClick={async () => {
              await setPlannedPurchased(personId, gift.id, !gift.purchased);
              await onChange();
            }}
          >
            {gift.purchased ? "Mark not yet" : "Mark purchased"}
          </button>
          <button
            type="button"
            {...stylex.props(app.quiet)}
            onClick={async () => {
              await deletePlannedGift(personId, gift.id);
              await onChange();
            }}
          >
            Delete
          </button>
        </div>
      ))}
      <GiftForm
        submitLabel="Add planned gift"
        allowQuantity={false}
        initialKind="CUSTOM"
        onAdd={async (input) => {
          await addPlannedGift(personId, input);
          await onChange();
        }}
      />
    </div>
  );
}

function ShoppingIdeas({
  personId,
  bands,
  onAdded,
}: {
  personId: string;
  bands: PriceBand[];
  onAdded: () => Promise<void>;
}) {
  const [ideas, setIdeas] = useState<GiftIdea[]>([]);
  const [message, setMessage] = useState("");
  const labels: Record<PriceBand, string> = {
    UNDER_25: "under $25",
    MID: "$25 to $75",
    OVER_75: "over $75",
  };
  return (
    <div {...stylex.props(app.stack)}>
      <div {...stylex.props(app.row)}>
        {bands.map((band) => (
          <button
            key={band}
            type="button"
            {...stylex.props(app.quiet)}
            onClick={async () => {
              const result = await askForShoppingIdeas(personId, band);
              setIdeas(result.ideas);
              setMessage(result.message || "");
            }}
          >
            Ideas {labels[band]}
          </button>
        ))}
      </div>
      {message ? <p>{message}</p> : null}
      {ideas.map((idea) => (
        <div key={idea.title} {...stylex.props(app.stack)}>
          <p>
            {idea.title} · {dollars(idea.price)}
          </p>
          <p>{idea.reason}</p>
          {idea.ratingLine ? <p>{idea.ratingLine}</p> : null}
          <button
            type="button"
            {...stylex.props(app.quiet)}
            onClick={async () => {
              await addPlannedGift(personId, {
                kind: idea.kind === "PRODUCT" ? "CUSTOM" : idea.kind,
                title: idea.title,
                price: idea.price,
                timingPhrase: idea.timingPhrase,
                membershipPhrase: idea.membershipPhrase,
              });
              await onAdded();
            }}
          >
            Add this idea
          </button>
        </div>
      ))}
    </div>
  );
}
