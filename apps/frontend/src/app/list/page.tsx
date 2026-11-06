"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { AppHeader } from "@/components/AppHeader";
import { BuyDialog, giftTitle } from "@/components/BuyDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { GiftForm } from "@/components/GiftForm";
import { ListMenu } from "@/components/ListMenu";
import {
  MembershipRadio,
  TimingRadio,
  VisibilityRadio,
} from "@/components/PhraseRadio";
import {
  purchasedSummary,
  ShopperPokeSection,
} from "@/components/ShopperPokeSection";
import { useAuth } from "@/hooks/useAuth";
import { app } from "@/app/appStyles";
import { rememberReturnTo } from "@/lib/returnTo";
import { trackTrialEvent } from "@/lib/analytics";
import { setAgentChildSafe } from "@/lib/webmcp";
import {
  addChild,
  addGift,
  askForIdeas,
  bandCopy,
  createList,
  deleteGift,
  deleteList,
  dismissPoke,
  dollars,
  fetchGuestList,
  fetchMyList,
  fetchMyLists,
  fetchReceivedGifts,
  fetchShopList,
  inviteCoManager,
  membershipCopy,
  rateGift,
  rateSuggestion,
  releaseGift,
  removeChild,
  removeCoManager,
  renameList,
  reserveGift,
  revealList,
  rotateShareToken,
  setListVisibility,
  setPurchased,
  thinBands,
  timingCopy,
  updateGift,
  visibilityCopy,
  type GiftIdea,
  type GuestList,
  type ListSummary,
  type MembershipPhrase,
  type OwnerGift,
  type OwnerList,
  type Poke,
  type PriceBand,
  type ReceivedGift,
  type ShopperGift,
  type ShopperList,
  type TimingPhrase,
} from "@/lib/api";

function ListPageInner() {
  const params = useSearchParams();
  const token = params.get("t");
  const id = params.get("id");
  const { user, loading } = useAuth();
  const [childSafe, setChildSafe] = useState(false);

  useEffect(() => {
    setAgentChildSafe(childSafe);
    return () => setAgentChildSafe(false);
  }, [childSafe]);

  return (
    <>
      <AppHeader />
      <main {...stylex.props(app.page)}>
        {token ? (
          <ShareView token={token} signedIn={!!user} authLoading={loading} />
        ) : (
          <OwnView id={id} childSafe={childSafe} setChildSafe={setChildSafe} />
        )}
      </main>
    </>
  );
}

function OwnView({
  id,
  childSafe,
  setChildSafe,
}: {
  id: string | null;
  childSafe: boolean;
  setChildSafe: (value: boolean) => void;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [list, setList] = useState<OwnerList | null>(null);
  const [error, setError] = useState("");
  const [received, setReceived] = useState<ReceivedGift[]>([]);
  const [showRevealedGifts, setShowRevealedGifts] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      rememberReturnTo(id ? `/list?id=${id}` : "/list");
      router.replace("/login");
    }
  }, [user, loading, router, id]);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      try {
        const mine = await fetchMyLists();
        if (cancel) return;
        if (!id) {
          const first = mine[0] ?? (await createList("My list"));
          router.replace(`/list?id=${first.id}`);
          return;
        }
        setLists(mine);
        const next = await fetchMyList(id);
        if (cancel) return;
        setList(next);
        if (next?.revealedAt) setShowRevealedGifts(true);
        if (next?.revealedAt && !next.isChild) {
          setReceived(await fetchReceivedGifts());
        }
      } catch (err) {
        if (!cancel) setError(err instanceof Error ? err.message : "Could not load the list.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [user, id, router]);

  if (!user) return <p>Loading…</p>;
  if (error) return <p role="alert" {...stylex.props(app.error)}>{error}</p>;
  if (!list) return <p>Loading…</p>;

  const showClaims = !childSafe && (list.managing || !!list.revealedAt);
  const bands = thinBands(list.gifts.map((gift) => gift.price));

  return (
    <>
      <div {...stylex.props(app.row)}>
        <h1 {...stylex.props(app.title)}>{list.name}</h1>
        <ListMenu lists={lists} />
      </div>
      <p>
        {list.isChild
          ? `This is ${list.recipientName}'s list. People can mark gifts as taken, and ${list.recipientName} will not see that.`
          : "People can mark gifts as taken, and you will not see that until you reveal the list."}
      </p>
      {list.isChild ? (
        <button
          type="button"
          {...stylex.props(app.quiet)}
          onClick={() => setChildSafe(!childSafe)}
        >
          {childSafe ? "Show the parent view" : "Show the view a child would see"}
        </button>
      ) : null}
      <VisibilityRadio
        value={list.visibility}
        onChange={async (visibility) =>
          setList({ ...list, ...(await setListVisibility(list.id, visibility)) })
        }
      />
      <ShareControl
        list={list}
        onRotate={async () =>
          setList({ ...list, ...(await rotateShareToken(list.id)) })
        }
      />
      <RenameControl
        name={list.name}
        onSave={async (name) =>
          setList({ ...list, ...(await renameList(list.id, name)) })
        }
      />
      {!list.revealedAt ? (
        <ConfirmDialog
          title="Reveal this list?"
          description="You will see which gifts were purchased. You still will not see who bought them. New reservations stop."
          confirmLabel="Reveal"
          onConfirm={async () => {
            const revealed = await revealList(list.id);
            setList(revealed);
            setShowRevealedGifts(false);
            if (!revealed.isChild) setReceived(await fetchReceivedGifts());
          }}
        >
          <button type="button" {...stylex.props(app.quiet)}>
            Reveal
          </button>
        </ConfirmDialog>
      ) : (
        <section {...stylex.props(app.card)}>
          <p>{purchasedSummary(list)}</p>
          {!showRevealedGifts ? (
            <button
              type="button"
              {...stylex.props(app.button)}
              onClick={() => setShowRevealedGifts(true)}
            >
              See which gifts were purchased
            </button>
          ) : null}
        </section>
      )}
      {!list.revealedAt || showRevealedGifts ? (
        <ul
          style={{
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {list.gifts.map((gift) => (
            <OwnerGiftCard
              key={gift.id}
              list={list}
              gift={gift}
              showClaims={showClaims}
              onReload={async () => {
                const next = await fetchMyList(list.id);
                if (next) setList(next);
              }}
            />
          ))}
        </ul>
      ) : null}
      {list.gifts.length === 0 ? (
        <p>Add a product link, a custom gift, an experience, or a membership.</p>
      ) : null}
      {!list.revealedAt ? (
        <GiftForm
          onAdd={async (input) => {
            await addGift(list.id, input);
            const next = await fetchMyList(list.id);
            if (next) setList(next);
          }}
        />
      ) : null}
      {!childSafe && (bands.length > 0 || list.pokes.length > 0) ? (
        <Ideas
          listId={list.id}
          bands={bands}
          pokes={list.pokes}
          onChanged={async () => {
            const next = await fetchMyList(list.id);
            if (next) setList(next);
          }}
        />
      ) : null}
      {!childSafe && list.revealedAt && !list.managing ? (
        <Ratings
          gifts={received}
          listId={list.id}
          onRated={async () => setReceived(await fetchReceivedGifts())}
        />
      ) : null}
      <ChildControls
        onAdd={async (name) => {
          const child = await addChild(name);
          window.location.assign(`/list?id=${child.id}`);
        }}
      />
      {list.isChild && !childSafe ? (
        <CoManagerSection
          list={list}
          currentUserId={user.userId}
          onChanged={async () => {
            const next = await fetchMyList(list.id);
            if (next) setList(next);
          }}
          onRemovedChild={() => router.push("/list")}
        />
      ) : null}
      <ConfirmDialog
        title="Delete this list?"
        description="This removes the list, every gift, every reservation, and every poke on it."
        confirmLabel="Delete list"
        onConfirm={async () => {
          await deleteList(list.id);
          router.push("/list");
        }}
      >
        <button type="button" {...stylex.props(app.quiet)}>
          Delete list
        </button>
      </ConfirmDialog>
    </>
  );
}

function OwnerGiftCard({
  list,
  gift,
  showClaims,
  onReload,
}: {
  list: OwnerList;
  gift: OwnerGift;
  showClaims: boolean;
  onReload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(gift.title || "");
  const [url, setUrl] = useState(gift.url || "");
  const [notes, setNotes] = useState(gift.notes || "");
  const [price, setPrice] = useState(
    gift.price != null ? (gift.price / 100).toFixed(2) : "",
  );
  const [quantity, setQuantity] = useState(gift.quantity);
  const [timing, setTiming] = useState<TimingPhrase>(
    gift.timingPhrase || "ANYTIME",
  );
  const [membership, setMembership] = useState<MembershipPhrase>(
    gift.membershipPhrase || "ANNUAL",
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState<ShopperGift | null>(null);
  const [shopperNote, setShopperNote] = useState("");

  const asShopperGift: ShopperGift = {
    id: gift.id,
    kind: gift.kind,
    title: gift.title,
    url: gift.url,
    price: gift.price,
    notes: gift.notes,
    quantity: gift.quantity,
    timingPhrase: gift.timingPhrase,
    membershipPhrase: gift.membershipPhrase,
    createdAt: gift.createdAt,
    slots: gift.shopperSlots ?? [],
    openCount: gift.openCount ?? 0,
  };

  return (
    <li {...stylex.props(app.card)}>
      {gift.url ? (
        <a href={gift.url} target="_blank" rel="noreferrer">
          <strong>{giftTitle(gift)}</strong>
        </a>
      ) : (
        <strong>{giftTitle(gift)}</strong>
      )}
      {gift.notes ? <p>{gift.notes}</p> : null}
      {gift.price != null ? <p>{dollars(gift.price)}</p> : null}
      {gift.quantity > 1 ? <p>Quantity: {gift.quantity}</p> : null}
      {gift.timingPhrase ? <p>{timingCopy[gift.timingPhrase]}</p> : null}
      {gift.membershipPhrase ? (
        <p>{membershipCopy[gift.membershipPhrase]}</p>
      ) : null}
      {showClaims && list.revealedAt && !list.managing
        ? gift.slots?.map((slot) => (
            <p
              key={slot.index}
              {...stylex.props(
                slot.status === "PURCHASED" ? app.statusBought : app.statusOpen,
              )}
            >
              {slot.status === "PURCHASED" ? "Purchased" : "Still open"}
            </p>
          ))
        : null}
      {showClaims && list.managing ? (
        <>
          {gift.shopperSlots?.map((slot) => (
            <p
              key={slot.index}
              {...stylex.props(
                slot.status === "OPEN"
                  ? app.statusOpen
                  : slot.status === "PURCHASED"
                    ? app.statusBought
                    : app.statusTaken,
              )}
            >
              {slot.status === "OPEN"
                ? "Available"
                : `${slot.status === "PURCHASED" ? "Bought" : "Taken"} by ${slot.shopperName}`}
              {slot.shopperNote ? ` — ${slot.shopperNote}` : ""}
            </p>
          ))}
          <div {...stylex.props(app.row)}>
            {gift.shopperSlots?.some((slot) => slot.status === "OPEN") ? (
              <button
                type="button"
                {...stylex.props(app.button)}
                onClick={async () => {
                  const updated = await reserveGift(list.id, gift.id);
                  setPending(updated);
                  await onReload();
                }}
              >
                {"I'll get this"}
              </button>
            ) : null}
            {gift.shopperSlots
              ?.filter((slot) => slot.mine && slot.status !== "OPEN")
              .map((slot) => (
                <span key={slot.index} {...stylex.props(app.row)}>
                  {slot.status === "RESERVED" ? (
                    <button
                      type="button"
                      {...stylex.props(app.button)}
                      onClick={() => setPending(asShopperGift)}
                    >
                      Did you buy it?
                    </button>
                  ) : (
                    <button
                      type="button"
                      {...stylex.props(app.quiet)}
                      onClick={async () => {
                        await setPurchased(list.id, gift.id, slot.index, false);
                        await onReload();
                      }}
                    >
                      Undo purchased
                    </button>
                  )}
                  <button
                    type="button"
                    {...stylex.props(app.quiet)}
                    onClick={async () => {
                      await releaseGift(list.id, gift.id, slot.index);
                      await onReload();
                    }}
                  >
                    Release
                  </button>
                </span>
              ))}
          </div>
        </>
      ) : null}
      {editing ? (
        <form
          {...stylex.props(app.stack)}
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            try {
              await updateGift(list.id, gift.id, {
                title,
                url,
                notes,
                quantity,
                price: price ? Math.round(Number(price) * 100) : null,
                timingPhrase: gift.kind === "EXPERIENCE" ? timing : null,
                membershipPhrase:
                  gift.kind === "MEMBERSHIP" ? membership : null,
              });
              setEditing(false);
              await onReload();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Could not save gift.",
              );
            }
          }}
        >
          <input
            aria-label="Edit title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            {...stylex.props(app.input)}
          />
          <input
            aria-label="Edit link"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Link"
            {...stylex.props(app.input)}
          />
          <input
            aria-label="Edit notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes"
            {...stylex.props(app.input)}
          />
          <input
            aria-label="Edit price"
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="Price"
            {...stylex.props(app.input)}
          />
          <label {...stylex.props(app.row)}>
            <span>Quantity</span>
            <input
              aria-label="Edit quantity"
              type="number"
              min={1}
              max={10}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              {...stylex.props(app.input)}
            />
          </label>
          {gift.kind === "EXPERIENCE" ? (
            <TimingRadio value={timing} onChange={setTiming} />
          ) : null}
          {gift.kind === "MEMBERSHIP" ? (
            <MembershipRadio value={membership} onChange={setMembership} />
          ) : null}
          {error ? (
            <p role="alert" {...stylex.props(app.error)}>
              {error}
            </p>
          ) : null}
          <div {...stylex.props(app.row)}>
            <button type="submit" {...stylex.props(app.button)}>
              Save gift
            </button>
            <button
              type="button"
              {...stylex.props(app.quiet)}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      <div {...stylex.props(app.row)}>
        {!editing ? (
          <button
            type="button"
            {...stylex.props(app.quiet)}
            onClick={() => setEditing(true)}
          >
            Edit gift
          </button>
        ) : null}
        <ConfirmDialog
          title="Delete this gift?"
          description="This also removes its reservation."
          confirmLabel="Delete gift"
          onConfirm={async () => {
            await deleteGift(list.id, gift.id);
            await onReload();
          }}
        >
          <button type="button" {...stylex.props(app.quiet)}>
            Delete gift
          </button>
        </ConfirmDialog>
      </div>
      {pending ? (
        <BuyDialog
          gift={pending}
          note={shopperNote}
          setNote={setShopperNote}
          onAnswer={async (bought) => {
            const slot =
              pending.slots.find(
                (item) => item.mine && item.status === "RESERVED",
              ) || pending.slots.find((item) => item.mine);
            if (!slot) return;
            await setPurchased(
              list.id,
              pending.id,
              slot.index,
              bought,
              shopperNote,
            );
            setShopperNote("");
            setPending(null);
            await onReload();
          }}
          onClose={async () => {
            setPending(null);
            await onReload();
          }}
        />
      ) : null}
    </li>
  );
}

function ShareControl({
  list,
  onRotate,
}: {
  list: ListSummary;
  onRotate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const href =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/list?t=${list.shareToken}`;
  return (
    <div {...stylex.props(app.row)}>
      <button
        type="button"
        {...stylex.props(app.button)}
        onClick={async () => {
          await navigator.clipboard?.writeText(href);
          trackTrialEvent("copy_share_link");
          setCopied(true);
        }}
      >
        {copied ? "Link copied" : "Copy share link"}
      </button>
      <button type="button" {...stylex.props(app.quiet)} onClick={onRotate}>
        Replace link
      </button>
      <p>{visibilityCopy[list.visibility]}.</p>
    </div>
  );
}

function RenameControl({
  name,
  onSave,
}: {
  name: string;
  onSave: (name: string) => void;
}) {
  const [value, setValue] = useState(name);
  return (
    <form
      {...stylex.props(app.row)}
      onSubmit={(event) => {
        event.preventDefault();
        onSave(value);
      }}
    >
      <label htmlFor="list-name">List name</label>
      <input
        id="list-name"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        {...stylex.props(app.input)}
      />
      <button type="submit" {...stylex.props(app.quiet)}>
        Save name
      </button>
    </form>
  );
}

function Ideas({
  listId,
  bands,
  pokes,
  onChanged,
}: {
  listId: string;
  bands: PriceBand[];
  pokes: Poke[];
  onChanged: () => Promise<void>;
}) {
  const [ideas, setIdeas] = useState<GiftIdea[]>([]);
  const [message, setMessage] = useState("");
  const labels: Record<PriceBand, string> = {
    UNDER_25: "under $25",
    MID: "$25 to $75",
    OVER_75: "over $75",
  };
  return (
    <section {...stylex.props(app.card)}>
      {bands.includes("UNDER_25") ? (
        <p>A few cheaper ideas are available.</p>
      ) : null}
      {pokes.map((poke) => (
        <div key={poke.id} {...stylex.props(app.row)}>
          <p>
            {poke.senderName} poked you for more ideas {bandCopy[poke.band]}
          </p>
          <button
            type="button"
            {...stylex.props(app.quiet)}
            onClick={async () => {
              const result = await askForIdeas(listId, poke.band);
              setIdeas(result.ideas);
              setMessage(result.message || "");
            }}
          >
            Ideas {labels[poke.band]}
          </button>
          <button
            type="button"
            {...stylex.props(app.quiet)}
            onClick={async () => {
              await dismissPoke(listId, poke.id);
              await onChanged();
            }}
          >
            Dismiss
          </button>
        </div>
      ))}
      <div {...stylex.props(app.row)}>
        {bands.map((band) => (
          <button
            key={band}
            type="button"
            {...stylex.props(app.quiet)}
            onClick={async () => {
              const result = await askForIdeas(listId, band);
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
              await addGift(listId, {
                kind: idea.kind === "PRODUCT" ? "CUSTOM" : idea.kind,
                title: idea.title,
                price: idea.price,
                timingPhrase: idea.timingPhrase,
                membershipPhrase: idea.membershipPhrase,
              });
              await onChanged();
            }}
          >
            Add this idea
          </button>
        </div>
      ))}
    </section>
  );
}

function Ratings({
  gifts,
  listId,
  onRated,
}: {
  gifts: ReceivedGift[];
  listId: string;
  onRated: () => Promise<void>;
}) {
  if (!gifts.length) return null;
  return (
    <section {...stylex.props(app.card)}>
      <h2>Rate what you received</h2>
      {gifts.map((gift) => (
        <div key={gift.id} {...stylex.props(app.stack)}>
          <p>
            {gift.title}
            {gift.stars != null
              ? ` · Rated ${gift.stars} star${gift.stars === 1 ? "" : "s"}`
              : ""}
          </p>
          {gift.ratingLine ? <p>{gift.ratingLine}</p> : null}
          <div {...stylex.props(app.row)}>
            {[1, 2, 3, 4, 5].map((stars) => (
              <button
                key={stars}
                type="button"
                aria-pressed={gift.stars === stars}
                {...stylex.props(gift.stars === stars ? app.button : app.quiet)}
                onClick={async () => {
                  if (gift.source === "SUGGESTION") {
                    await rateSuggestion(gift.id, stars);
                  } else {
                    await rateGift(listId, gift.id, stars);
                  }
                  await onRated();
                }}
              >
                {stars} star{stars === 1 ? "" : "s"}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function ChildControls({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  return (
    <form
      {...stylex.props(app.row)}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim()) return;
        await onAdd(name);
        setName("");
      }}
    >
      <input
        aria-label="Child's name"
        placeholder="Add a child"
        value={name}
        onChange={(event) => setName(event.target.value)}
        {...stylex.props(app.input)}
      />
      <button type="submit" {...stylex.props(app.quiet)}>
        Add child
      </button>
    </form>
  );
}

function CoManagerSection({
  list,
  currentUserId,
  onChanged,
  onRemovedChild,
}: {
  list: OwnerList;
  currentUserId: string;
  onChanged: () => Promise<void>;
  onRemovedChild: () => void;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const coManagers = list.managers.filter(
    (person) => person.userId !== currentUserId,
  );
  return (
    <section {...stylex.props(app.card)}>
      <h2>Managing {list.recipientName}</h2>
      <form
        {...stylex.props(app.row)}
        onSubmit={async (event) => {
          event.preventDefault();
          await inviteCoManager(list.recipientId, email);
          setMessage("Invited.");
          setEmail("");
          await onChanged();
        }}
      >
        <input
          aria-label="Co-manager email"
          type="email"
          placeholder="Invite another adult"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          {...stylex.props(app.input)}
        />
        <button type="submit" {...stylex.props(app.quiet)}>
          Invite co-manager
        </button>
        {message ? <p>{message}</p> : null}
      </form>
      {coManagers.map((person) => (
        <div key={person.userId} {...stylex.props(app.row)}>
          <span>{person.displayName}</span>
          <ConfirmDialog
            title={`Remove ${person.displayName} as a co-manager?`}
            description={`They will no longer edit ${list.recipientName}'s list or see claims on it.`}
            confirmLabel="Remove co-manager"
            onConfirm={async () => {
              await removeCoManager(list.recipientId, person.userId);
              await onChanged();
            }}
          >
            <button type="button" {...stylex.props(app.quiet)}>
              Remove co-manager
            </button>
          </ConfirmDialog>
        </div>
      ))}
      <ConfirmDialog
        title={`Remove ${list.recipientName}?`}
        description={`This removes ${list.recipientName}'s list, every gift, every reservation, and every poke on it.`}
        confirmLabel={`Remove ${list.recipientName}`}
        onConfirm={async () => {
          await removeChild(list.recipientId);
          onRemovedChild();
        }}
      >
        <button type="button" {...stylex.props(app.quiet)}>
          Remove {list.recipientName}
        </button>
      </ConfirmDialog>
    </section>
  );
}

function ShareView({
  token,
  signedIn,
  authLoading,
}: {
  token: string;
  signedIn: boolean;
  authLoading: boolean;
}) {
  const router = useRouter();
  const [guest, setGuest] = useState<GuestList | null>(null);
  const [shop, setShop] = useState<ShopperList | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<ShopperGift | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (authLoading) return;
    let cancel = false;
    (async () => {
      try {
        setNotFound(false);
        if (signedIn) {
          const next = await fetchShopList(token);
          if (cancel) return;
          if (next) {
            setShop(next);
            return;
          }
          const mine = await fetchMyLists().catch(() => [] as ListSummary[]);
          if (cancel) return;
          const own = mine.find((item) => item.shareToken === token);
          if (own && !own.isChild) {
            router.replace(`/list?id=${own.id}`);
            return;
          }
          setNotFound(true);
        } else {
          const next = await fetchGuestList(token);
          if (cancel) return;
          if (!next) {
            rememberReturnTo(`/list?t=${token}`);
            router.replace("/login");
            return;
          }
          setGuest(next);
        }
      } catch (err) {
        if (!cancel) {
          setError(err instanceof Error ? err.message : "This list wasn't found.");
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [token, signedIn, authLoading, router]);

  if (error) return <p role="alert" {...stylex.props(app.error)}>{error}</p>;
  if (notFound) return <p>This list wasn&apos;t found.</p>;
  const list = signedIn ? shop : guest;
  if (!list) return <p>Loading…</p>;

  const shopperThinBands =
    signedIn && shop
      ? thinBands(shop.gifts.map((gift) => gift.price))
      : [];

  return (
    <>
      <h1 {...stylex.props(app.title)}>{list.name}</h1>
      <p>{`${list.recipientName}'s list`}</p>
      {"commissionDisclosure" in list && list.commissionDisclosure ? (
        <p>Nicelist may earn a commission when you buy through a partner link.</p>
      ) : null}
      {"openCount" in list ? <p>{list.openCount} still open</p> : null}
      <ul
        style={{
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {(signedIn ? shop?.gifts ?? [] : guest?.gifts ?? []).map((gift) => (
          <li id={`gift-${gift.id}`} key={gift.id} {...stylex.props(app.card)}>
            <strong>{giftTitle(gift)}</strong>
            {gift.notes ? <p>{gift.notes}</p> : null}
            {gift.price != null ? <p>{dollars(gift.price)}</p> : null}
            {gift.timingPhrase ? <p>{timingCopy[gift.timingPhrase]}</p> : null}
            {gift.membershipPhrase ? (
              <p>{membershipCopy[gift.membershipPhrase]}</p>
            ) : null}
            {"openCount" in gift && "reservedCount" in gift ? (
              <>
                <p>
                  {gift.openCount} open, {gift.reservedCount} reserved,{" "}
                  {gift.purchasedCount} purchased
                </p>
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
              </>
            ) : null}
            {"slots" in gift ? (
              <>
                {gift.quantity > 1 ? (
                  <p>{gift.openCount} still open</p>
                ) : null}
                {gift.slots.map((slot) => (
                  <p
                    key={slot.index}
                    {...stylex.props(
                      slot.status === "OPEN"
                        ? app.statusOpen
                        : slot.status === "PURCHASED"
                          ? app.statusBought
                          : app.statusTaken,
                    )}
                  >
                    {slot.status === "OPEN"
                      ? "Available"
                      : slot.status === "PURCHASED"
                        ? `Bought by ${slot.shopperName}`
                        : `Taken by ${slot.shopperName}`}
                    {slot.shopperNote ? ` — ${slot.shopperNote}` : ""}
                  </p>
                ))}
              </>
            ) : null}
            {("slots" in gift
              ? gift.slots.some((slot) => slot.status === "OPEN") &&
                !shop?.revealed
              : gift.openCount > 0) ? (
              <button
                type="button"
                {...stylex.props(app.button)}
                onClick={async () => {
                  if (!signedIn || !shop) {
                    rememberReturnTo(`/list?t=${token}#gift-${gift.id}`);
                    router.push("/login");
                    return;
                  }
                  const updated = await reserveGift(shop.id, gift.id);
                  setPending(updated);
                  setShop(await fetchShopList(token));
                }}
              >
                {"I'll get this"}
              </button>
            ) : null}
            {"slots" in gift && !shop?.revealed
              ? gift.slots
                  .filter((slot) => slot.mine && slot.status !== "OPEN")
                  .map((slot) => (
                    <span key={slot.index} {...stylex.props(app.row)}>
                      {slot.status === "RESERVED" ? (
                        <button
                          type="button"
                          {...stylex.props(app.button)}
                          onClick={() => setPending(gift)}
                        >
                          Did you buy it?
                        </button>
                      ) : (
                        <button
                          type="button"
                          {...stylex.props(app.quiet)}
                          onClick={async () => {
                            if (!shop) return;
                            await setPurchased(
                              shop.id,
                              gift.id,
                              slot.index,
                              false,
                            );
                            setShop(await fetchShopList(token));
                          }}
                        >
                          Undo purchased
                        </button>
                      )}
                      <button
                        type="button"
                        {...stylex.props(app.quiet)}
                        onClick={async () => {
                          if (!shop) return;
                          await releaseGift(shop.id, gift.id, slot.index);
                          setShop(await fetchShopList(token));
                        }}
                      >
                        Release
                      </button>
                    </span>
                  ))
              : null}
          </li>
        ))}
      </ul>
      {signedIn && shop && shop.canPoke && !shop.revealed && shopperThinBands.length > 0 ? (
        <ShopperPokeSection
          listId={shop.id}
          recipientName={shop.recipientName}
          bands={shopperThinBands}
          myPokes={shop.myPokes}
          onPoked={async () => setShop(await fetchShopList(token))}
        />
      ) : null}
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
            if (!slot || !shop) return;
            await setPurchased(shop.id, pending.id, slot.index, bought, note);
            setNote("");
            setPending(null);
            setShop(await fetchShopList(token));
          }}
          onClose={async () => {
            setPending(null);
            if (shop) setShop(await fetchShopList(token));
          }}
        />
      ) : null}
    </>
  );
}

export default function ListPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <ListPageInner />
    </Suspense>
  );
}
