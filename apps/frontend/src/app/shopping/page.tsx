"use client";

import { useEffect, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { AppHeader } from "@/components/AppHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { app } from "@/app/appStyles";
import {
  addPlannedGift,
  addShoppingPerson,
  deletePlannedGift,
  deleteShoppingList,
  dollars,
  fetchFriends,
  fetchMyLists,
  fetchShoppingList,
  fetchShoppingPerson,
  releaseGift,
  removeShoppingPerson,
  renameShoppingList,
  reserveGift,
  setAgainNextYear,
  setPlannedPurchased,
  setPurchased,
  setStandingNote,
  type FriendsView,
  type ListSummary,
  type ShoppingList,
  type ShopperGift,
} from "@/lib/api";

export default function ShoppingPage() {
  return (
    <ProtectedRoute>
      <AppHeader />
      <ShoppingBody />
    </ProtectedRoute>
  );
}

function ShoppingBody() {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [friends, setFriends] = useState<FriendsView | null>(null);
  const [children, setChildren] = useState<ListSummary[]>([]);
  const [gifts, setGifts] = useState<Record<string, { listId: string | null; gifts: ShopperGift[] }>>({});
  const [name, setName] = useState("");
  const [personName, setPersonName] = useState("");
  const [error, setError] = useState("");

  async function reload() {
    const next = await fetchShoppingList();
    setList(next);
    setName(next.name);
    const loaded: Record<string, { listId: string | null; gifts: ShopperGift[] }> = {};
    for (const person of next.people) {
      if (!person.refId) continue;
      const result = await fetchShoppingPerson(person.id);
      loaded[person.id] = { listId: result?.listId ?? null, gifts: result?.gifts ?? [] };
    }
    setGifts(loaded);
  }

  useEffect(() => {
    Promise.all([fetchShoppingList(), fetchFriends(), fetchMyLists()])
      .then(async ([shopping, friendView, lists]) => {
        setList(shopping);
        setName(shopping.name);
        setFriends(friendView);
        setChildren(lists.filter((item) => item.isChild));
        const loaded: Record<string, { listId: string | null; gifts: ShopperGift[] }> = {};
        for (const person of shopping.people) {
          if (!person.refId) continue;
          const result = await fetchShoppingPerson(person.id);
          loaded[person.id] = { listId: result?.listId ?? null, gifts: result?.gifts ?? [] };
        }
        setGifts(loaded);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load the shopping list."));
  }, []);

  if (error) return <main {...stylex.props(app.page)}><p {...stylex.props(app.error)}>{error}</p></main>;
  if (!list) return <main {...stylex.props(app.page)}><p>Loading…</p></main>;

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
        <input id="shopping-name" value={name} onChange={(event) => setName(event.target.value)} {...stylex.props(app.input)} />
        <button type="submit" {...stylex.props(app.quiet)}>Rename</button>
      </form>
      <p>Total {dollars(list.totalCents)}</p>
      <form
        {...stylex.props(app.row)}
        onSubmit={async (event) => {
          event.preventDefault();
          await addShoppingPerson(personName, "NAME");
          setPersonName("");
          await reload();
        }}
      >
        <input aria-label="Person with no account" placeholder="Add someone, such as Grandpa" value={personName} onChange={(event) => setPersonName(event.target.value)} {...stylex.props(app.input)} />
        <button type="submit" {...stylex.props(app.quiet)}>Add name</button>
      </form>
      <div {...stylex.props(app.row)}>
        {friends?.friends.map((friend) => (
          <button key={friend.userId} type="button" {...stylex.props(app.quiet)} onClick={async () => { await addShoppingPerson(friend.displayName, "FRIEND", friend.userId); await reload(); }}>
            Add {friend.displayName}
          </button>
        ))}
        {children.map((child) => (
          <button key={child.id} type="button" {...stylex.props(app.quiet)} onClick={async () => { await addShoppingPerson(child.recipientName, "CHILD", child.recipientId); await reload(); }}>
            Add {child.recipientName}
          </button>
        ))}
      </div>
      {list.people.map((person) => (
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
            <input name="note" aria-label={`Note for ${person.name}`} defaultValue={person.standingNote || ""} placeholder="Size, color to avoid, where to ship" {...stylex.props(app.input)} />
            <button type="submit" {...stylex.props(app.quiet)}>Save note</button>
          </form>
          <PersonGifts
            personId={person.id}
            listId={gifts[person.id]?.listId || ""}
            gifts={gifts[person.id]?.gifts || []}
            again={list.againClaimIds}
            onChange={reload}
          />
          <PlannedGifts personId={person.id} gifts={list.plannedGifts.filter((gift) => gift.personId === person.id)} onChange={reload} />
          <button type="button" {...stylex.props(app.quiet)} onClick={async () => { await removeShoppingPerson(person.id); await reload(); }}>
            Remove {person.name}
          </button>
        </section>
      ))}
      <ConfirmDialog
        title="Delete this shopping list?"
        description="This removes the people and private planned gifts. It does not release wishlist claims."
        confirmLabel="Delete shopping list"
        onConfirm={async () => { await deleteShoppingList(); await reload(); }}
      >
        <button type="button" {...stylex.props(app.quiet)}>Delete shopping list</button>
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
  return (
    <>
      {gifts.map((gift) =>
        gift.slots
          .filter((slot) => slot.status === "OPEN" || slot.mine)
          .map((slot) => (
            <div key={`${gift.id}-${slot.index}`} {...stylex.props(app.row)}>
              <span>{gift.title || gift.url || "Gift"} · {slot.status === "OPEN" ? "Available" : slot.status}</span>
              {slot.status === "OPEN" ? (
                <button type="button" {...stylex.props(app.button)} onClick={async () => { await reserveGift(listId, gift.id); await onChange(); }}>
                  {"I'll get this"}
                </button>
              ) : null}
              {slot.mine && slot.status === "RESERVED" ? (
                <button type="button" {...stylex.props(app.quiet)} onClick={async () => { await setPurchased(listId, gift.id, slot.index, true); await onChange(); }}>
                  Mark purchased
                </button>
              ) : null}
              {slot.mine && slot.status !== "OPEN" ? (
                <button type="button" {...stylex.props(app.quiet)} onClick={async () => { await releaseGift(listId, gift.id, slot.index); await onChange(); }}>
                  Release
                </button>
              ) : null}
              {slot.mine && slot.claimId ? (
                <button
                  type="button"
                  {...stylex.props(app.quiet)}
                  onClick={async () => {
                    await setAgainNextYear(slot.claimId || "", personId, !again.includes(slot.claimId || ""));
                    await onChange();
                  }}
                >
                  {again.includes(slot.claimId) ? "Saved for next year" : "Again next year"}
                </button>
              ) : null}
            </div>
          )),
      )}
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
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  return (
    <div>
      {gifts.map((gift) => (
        <div key={gift.id} {...stylex.props(app.row)}>
          <span>{gift.title || "Planned gift"} {gift.purchased ? "· purchased" : "· still to buy"} {gift.price != null ? dollars(gift.price) : ""}</span>
          <button type="button" {...stylex.props(app.quiet)} onClick={async () => { await setPlannedPurchased(personId, gift.id, !gift.purchased); await onChange(); }}>
            {gift.purchased ? "Mark not yet" : "Mark purchased"}
          </button>
          <button type="button" {...stylex.props(app.quiet)} onClick={async () => { await deletePlannedGift(personId, gift.id); await onChange(); }}>
            Delete
          </button>
        </div>
      ))}
      <form
        {...stylex.props(app.row)}
        onSubmit={async (event) => {
          event.preventDefault();
          await addPlannedGift(personId, {
            kind: "CUSTOM",
            title,
            url,
            notes,
            price: price ? Math.round(Number(price) * 100) : null,
          });
          setTitle("");
          setUrl("");
          setNotes("");
          setPrice("");
          await onChange();
        }}
      >
        <input aria-label="Private planned gift" placeholder="A gift that is not on their list" value={title} onChange={(event) => setTitle(event.target.value)} {...stylex.props(app.input)} />
        <input aria-label="Optional link" placeholder="Optional link" value={url} onChange={(event) => setUrl(event.target.value)} {...stylex.props(app.input)} />
        <input aria-label="Notes" placeholder="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} {...stylex.props(app.input)} />
        <input aria-label="Price" placeholder="Price" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} {...stylex.props(app.input)} />
        <button type="submit" {...stylex.props(app.quiet)}>Add planned gift</button>
      </form>
    </div>
  );
}
