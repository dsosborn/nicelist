"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Collapsible, Dialog, DropdownMenu, RadioGroup } from "radix-ui";
import * as stylex from "@stylexjs/stylex";
import { AppHeader } from "@/components/AppHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { app } from "@/app/appStyles";
import { rememberReturnTo } from "@/lib/returnTo";
import { setAgentChildSafe } from "@/lib/webmcp";
import {
  addChild,
  addGift,
  askForIdeas,
  createList,
  deleteGift,
  deleteList,
  dollars,
  fetchGuestList,
  fetchMyList,
  fetchMyLists,
  fetchReceivedGifts,
  fetchShopList,
  inviteCoManager,
  membershipCopy,
  rateGift,
  releaseGift,
  renameList,
  reserveGift,
  revealList,
  rotateShareToken,
  setListVisibility,
  setPurchased,
  thinBands,
  timingCopy,
  visibilityCopy,
  type GiftIdea,
  type GiftInput,
  type GiftKind,
  type GuestList,
  type ListSummary,
  type MembershipPhrase,
  type OwnerList,
  type PriceBand,
  type ReceivedGift,
  type ShopperGift,
  type ShopperList,
  type TimingPhrase,
  type Visibility,
} from "@/lib/api";

const kinds: { id: GiftKind; label: string }[] = [
  { id: "PRODUCT", label: "Product link" },
  { id: "CUSTOM", label: "Custom gift" },
  { id: "EXPERIENCE", label: "Experience" },
  { id: "MEMBERSHIP", label: "Membership" },
];

function giftTitle(gift: { title: string | null; url: string | null }) {
  return gift.title || gift.url || "Gift";
}

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
        if (next?.revealedAt && !next.isChild) setReceived(await fetchReceivedGifts());
      } catch (err) {
        if (!cancel) setError(err instanceof Error ? err.message : "Could not load the list.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [user, id, router]);

  if (!user) return <p>Loading…</p>;
  if (error) return <p {...stylex.props(app.error)}>{error}</p>;
  if (!list) return <p>Loading…</p>;

  const showClaims = !childSafe && (list.managing || !!list.revealedAt);
  const bands = thinBands(list.gifts.map((gift) => gift.price));

  return (
    <>
      <div {...stylex.props(app.row)}>
        <h1 {...stylex.props(app.title)}>{list.name}</h1>
        {lists.length > 1 ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger {...stylex.props(app.quiet)}>Switch list</DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content {...stylex.props(app.menu)}>
                {lists.map((item) => (
                  <DropdownMenu.Item key={item.id} asChild>
                    <Link href={`/list?id=${item.id}`} {...stylex.props(app.menuItem)}>
                      {item.recipientName}: {item.name}
                    </Link>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : null}
      </div>
      <p>
        {list.isChild
          ? `This is ${list.recipientName}'s list. People can mark gifts as taken, and ${list.recipientName} will not see that.`
          : "People can mark gifts as taken, and you will not see that until you reveal the list."}
      </p>
      {list.isChild ? (
        <button type="button" {...stylex.props(app.quiet)} onClick={() => setChildSafe(!childSafe)}>
          {childSafe ? "Show the parent view" : "Show the view a child would see"}
        </button>
      ) : null}
      <VisibilityControl
        value={list.visibility}
        onChange={async (visibility) => setList({ ...list, ...(await setListVisibility(list.id, visibility)) })}
      />
      <ShareControl list={list} onRotate={async () => setList({ ...list, ...(await rotateShareToken(list.id)) })} />
      <RenameControl
        name={list.name}
        onSave={async (name) => setList({ ...list, ...(await renameList(list.id, name)) })}
      />
      {!list.revealedAt ? (
        <ConfirmDialog
          title="Reveal this list?"
          description="You will see which gifts were purchased. You still will not see who bought them. New reservations stop."
          confirmLabel="Reveal"
          onConfirm={async () => setList(await revealList(list.id))}
        >
          <button type="button" {...stylex.props(app.quiet)}>Reveal</button>
        </ConfirmDialog>
      ) : (
        <p>{purchasedSummary(list)}</p>
      )}
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {list.gifts.map((gift) => (
          <li key={gift.id} {...stylex.props(app.card)}>
            <strong>{giftTitle(gift)}</strong>
            {gift.notes ? <p>{gift.notes}</p> : null}
            {gift.price != null ? <p>{dollars(gift.price)}</p> : null}
            {gift.timingPhrase ? <p>{timingCopy[gift.timingPhrase]}</p> : null}
            {gift.membershipPhrase ? <p>{membershipCopy[gift.membershipPhrase]}</p> : null}
            {showClaims && list.revealedAt && !list.managing
              ? gift.slots?.map((slot) => (
                  <p key={slot.index}>{slot.status === "PURCHASED" ? "Purchased" : "Still open"}</p>
                ))
              : null}
            {showClaims && list.managing
              ? gift.shopperSlots?.map((slot) => (
                  <p key={slot.index}>
                    {slot.status === "OPEN" ? "Available" : `${slot.status === "PURCHASED" ? "Bought" : "Taken"} by ${slot.shopperName}`}
                    {slot.shopperNote ? ` — ${slot.shopperNote}` : ""}
                  </p>
                ))
              : null}
            <ConfirmDialog
              title="Delete this gift?"
              description="This also removes its reservation."
              confirmLabel="Delete gift"
              onConfirm={async () => {
                await deleteGift(list.id, gift.id);
                setList(await fetchMyList(list.id));
              }}
            >
              <button type="button" {...stylex.props(app.quiet)}>Delete gift</button>
            </ConfirmDialog>
          </li>
        ))}
      </ul>
      {list.gifts.length === 0 ? <p>Add a product link, a custom gift, an experience, or a membership.</p> : null}
      {!list.revealedAt ? (
        <GiftForm
          onAdd={async (input) => {
            await addGift(list.id, input);
            setList(await fetchMyList(list.id));
          }}
        />
      ) : null}
      {!childSafe && bands.length ? <Ideas listId={list.id} bands={bands} onAdded={async () => setList(await fetchMyList(list.id))} /> : null}
      {!childSafe && list.revealedAt && !list.managing ? <Ratings gifts={received} listId={list.id} /> : null}
      <ChildControls
        onAdd={async (name) => {
          const child = await addChild(name);
          router.push(`/list?id=${child.id}`);
        }}
      />
      {list.isChild ? (
        <CoManagerForm childId={list.recipientId} />
      ) : null}
      <ConfirmDialog
        title="Delete this list?"
        description="This removes the list, every gift, and every reservation."
        confirmLabel="Delete list"
        onConfirm={async () => {
          await deleteList(list.id);
          router.push("/list");
        }}
      >
        <button type="button" {...stylex.props(app.quiet)}>Delete list</button>
      </ConfirmDialog>
    </>
  );
}

function purchasedSummary(list: OwnerList) {
  const slots = list.gifts.flatMap((gift) => gift.slots ?? []);
  const bought = slots.filter((slot) => slot.status === "PURCHASED").length;
  return `${bought} of ${slots.length || list.gifts.length} were purchased`;
}

function VisibilityControl({ value, onChange }: { value: Visibility; onChange: (value: Visibility) => void }) {
  return (
    <RadioGroup.Root value={value} onValueChange={(next) => onChange(next as Visibility)} aria-label="Who can see this list">
      {(Object.keys(visibilityCopy) as Visibility[]).map((item) => (
        <label key={item} {...stylex.props(app.row)}>
          <RadioGroup.Item value={item} aria-label={visibilityCopy[item]} />
          {visibilityCopy[item]}
        </label>
      ))}
    </RadioGroup.Root>
  );
}

function ShareControl({ list, onRotate }: { list: ListSummary; onRotate: () => void }) {
  const href = typeof window === "undefined" ? "" : `${window.location.origin}/list?t=${list.shareToken}`;
  return (
    <div {...stylex.props(app.row)}>
      <button
        type="button"
        {...stylex.props(app.button)}
        onClick={() => navigator.clipboard.writeText(href)}
      >
        Copy share link
      </button>
      <button type="button" {...stylex.props(app.quiet)} onClick={onRotate}>
        Replace link
      </button>
      <p>{visibilityCopy[list.visibility]}.</p>
    </div>
  );
}

function RenameControl({ name, onSave }: { name: string; onSave: (name: string) => void }) {
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
      <input id="list-name" value={value} onChange={(event) => setValue(event.target.value)} {...stylex.props(app.input)} />
      <button type="submit" {...stylex.props(app.quiet)}>Save name</button>
    </form>
  );
}

function GiftForm({ onAdd }: { onAdd: (input: GiftInput) => Promise<void> }) {
  const [kind, setKind] = useState<GiftKind>("PRODUCT");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [timing, setTiming] = useState<TimingPhrase>("ANYTIME");
  const [membership, setMembership] = useState<MembershipPhrase>("ANNUAL");
  const [error, setError] = useState("");

  return (
    <form
      {...stylex.props(app.card)}
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        try {
          await onAdd({
            kind,
            title,
            url,
            notes,
            quantity,
            price: price ? Math.round(Number(price) * 100) : null,
            timingPhrase: kind === "EXPERIENCE" ? timing : null,
            membershipPhrase: kind === "MEMBERSHIP" ? membership : null,
          });
          setTitle("");
          setUrl("");
          setNotes("");
          setPrice("");
          setQuantity(1);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not add that gift.");
        }
      }}
    >
      <div {...stylex.props(app.row)}>
        {kinds.map((item) => (
          <button key={item.id} type="button" {...stylex.props(kind === item.id ? app.button : app.quiet)} onClick={() => setKind(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {kind === "PRODUCT" ? (
        <input aria-label="Product link" placeholder="Paste a product link" value={url} onChange={(event) => setUrl(event.target.value)} {...stylex.props(app.input)} />
      ) : (
        <input aria-label="Title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} required {...stylex.props(app.input)} />
      )}
      <Collapsible.Root>
        <Collapsible.Trigger asChild>
          <button type="button" {...stylex.props(app.quiet)}>More details</button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          {kind === "PRODUCT" ? (
            <input aria-label="Title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} {...stylex.props(app.input)} />
          ) : (
            <input aria-label="Link" placeholder="Optional link" value={url} onChange={(event) => setUrl(event.target.value)} {...stylex.props(app.input)} />
          )}
          <input aria-label="Notes" placeholder="Notes, such as size or which shop" value={notes} onChange={(event) => setNotes(event.target.value)} {...stylex.props(app.input)} />
          <input aria-label="Price" placeholder="Price" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} {...stylex.props(app.input)} />
          <label>
            Quantity
            <input aria-label="Quantity" type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} {...stylex.props(app.input)} />
          </label>
          {kind === "EXPERIENCE" ? (
            <select aria-label="When" value={timing} onChange={(event) => setTiming(event.target.value as TimingPhrase)} {...stylex.props(app.input)}>
              {(Object.keys(timingCopy) as TimingPhrase[]).map((item) => (
                <option key={item} value={item}>{timingCopy[item]}</option>
              ))}
            </select>
          ) : null}
          {kind === "MEMBERSHIP" ? (
            <select aria-label="Membership type" value={membership} onChange={(event) => setMembership(event.target.value as MembershipPhrase)} {...stylex.props(app.input)}>
              {(Object.keys(membershipCopy) as MembershipPhrase[]).map((item) => (
                <option key={item} value={item}>{membershipCopy[item]}</option>
              ))}
            </select>
          ) : null}
        </Collapsible.Content>
      </Collapsible.Root>
      {error ? <p {...stylex.props(app.error)}>{error}</p> : null}
      <button type="submit" {...stylex.props(app.button)}>Add gift</button>
    </form>
  );
}

function Ideas({ listId, bands, onAdded }: { listId: string; bands: PriceBand[]; onAdded: () => Promise<void> }) {
  const [ideas, setIdeas] = useState<GiftIdea[]>([]);
  const [message, setMessage] = useState("");
  const labels: Record<PriceBand, string> = { UNDER_25: "under $25", MID: "$25 to $75", OVER_75: "over $75" };
  return (
    <section {...stylex.props(app.card)}>
      <p>A few cheaper ideas are available.</p>
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
      {message ? <p>{message}</p> : null}
      {ideas.map((idea) => (
        <div key={idea.title}>
          <p>{idea.title} · {dollars(idea.price)}</p>
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
              await onAdded();
            }}
          >
            Add this idea
          </button>
        </div>
      ))}
    </section>
  );
}

function Ratings({ gifts, listId }: { gifts: ReceivedGift[]; listId: string }) {
  if (!gifts.length) return null;
  return (
    <section {...stylex.props(app.card)}>
      <h2>Rate what you received</h2>
      {gifts.map((gift) => (
        <div key={gift.id}>
          <p>{gift.title}</p>
          <div {...stylex.props(app.row)}>
            {[1, 2, 3, 4, 5].map((stars) => (
              <button key={stars} type="button" {...stylex.props(app.quiet)} onClick={() => rateGift(listId, gift.id, stars)}>
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
        await onAdd(name);
        setName("");
      }}
    >
      <input aria-label="Child's name" placeholder="Add a child" value={name} onChange={(event) => setName(event.target.value)} {...stylex.props(app.input)} />
      <button type="submit" {...stylex.props(app.quiet)}>Add child</button>
    </form>
  );
}

function CoManagerForm({ childId }: { childId: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  return (
    <form
      {...stylex.props(app.row)}
      onSubmit={async (event) => {
        event.preventDefault();
        await inviteCoManager(childId, email);
        setMessage("Invited.");
        setEmail("");
      }}
    >
      <input aria-label="Co-manager email" type="email" placeholder="Invite another adult" value={email} onChange={(event) => setEmail(event.target.value)} {...stylex.props(app.input)} />
      <button type="submit" {...stylex.props(app.quiet)}>Invite co-manager</button>
      {message ? <p>{message}</p> : null}
    </form>
  );
}

function ShareView({ token, signedIn, authLoading }: { token: string; signedIn: boolean; authLoading: boolean }) {
  const [guest, setGuest] = useState<GuestList | null>(null);
  const [shop, setShop] = useState<ShopperList | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<ShopperGift | null>(null);
  const [note, setNote] = useState("");

  async function load() {
    if (signedIn) setShop(await fetchShopList(token));
    else setGuest(await fetchGuestList(token));
  }

  useEffect(() => {
    if (authLoading) return;
    load().catch((err) => setError(err instanceof Error ? err.message : "This list wasn't found."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, signedIn, authLoading]);

  if (error) return <p {...stylex.props(app.error)}>{error}</p>;
  const list = signedIn ? shop : guest;
  if (!list) return <p>{authLoading ? "Loading…" : "This list wasn't found."}</p>;

  return (
    <>
      <h1 {...stylex.props(app.title)}>{list.name}</h1>
      <p>{`${list.recipientName}'s list`}</p>
      {"commissionDisclosure" in list && list.commissionDisclosure ? (
        <p>Nicelist may earn a commission when you buy through a partner link.</p>
      ) : null}
      {"openCount" in list ? <p>{list.openCount} still open</p> : null}
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {(signedIn ? shop?.gifts ?? [] : guest?.gifts ?? []).map((gift) => (
          <li key={gift.id} {...stylex.props(app.card)}>
            <strong>{giftTitle(gift)}</strong>
            {gift.notes ? <p>{gift.notes}</p> : null}
            {gift.price != null ? <p>{dollars(gift.price)}</p> : null}
            {"openCount" in gift && "reservedCount" in gift ? (
              <p>{gift.openCount} open, {gift.reservedCount} reserved, {gift.purchasedCount} purchased</p>
            ) : null}
            {"slots" in gift
              ? gift.slots.map((slot) => (
                  <p key={slot.index}>
                    {slot.status === "OPEN" ? "Available" : slot.status === "PURCHASED" ? `Bought by ${slot.shopperName}` : `Taken by ${slot.shopperName}`}
                    {slot.shopperNote ? ` — ${slot.shopperNote}` : ""}
                  </p>
                ))
              : null}
            {("slots" in gift ? gift.slots.some((slot) => slot.status === "OPEN") : gift.openCount > 0) ? (
              <button
                type="button"
                {...stylex.props(app.button)}
                onClick={async () => {
                  if (!signedIn || !shop) {
                    rememberReturnTo(`/list?t=${token}`);
                    window.location.href = "/login";
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
            {"slots" in gift
              ? gift.slots
                  .filter((slot) => slot.mine && slot.status !== "OPEN")
                  .map((slot) => (
                    <span key={slot.index} {...stylex.props(app.row)}>
                      {slot.status === "RESERVED" ? (
                        <button type="button" {...stylex.props(app.button)} onClick={() => setPending(gift)}>
                          Did you buy it?
                        </button>
                      ) : null}
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
      {pending ? (
        <BuyDialog
          gift={pending}
          note={note}
          setNote={setNote}
          onAnswer={async (bought) => {
            const slot =
              pending.slots.find((item) => item.mine && item.status === "RESERVED") ||
              pending.slots.find((item) => item.mine);
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

function BuyDialog({
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
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay {...stylex.props(app.overlay)} />
        <Dialog.Content {...stylex.props(app.dialog)}>
          <Dialog.Title>Did you buy it?</Dialog.Title>
          <Dialog.Description>{giftTitle(gift)} stays reserved until you answer.</Dialog.Description>
          <label htmlFor="shopper-note">Note for other shoppers</label>
          <input id="shopper-note" value={note} onChange={(event) => setNote(event.target.value)} {...stylex.props(app.input)} />
          <div {...stylex.props(app.row)}>
            {link ? (
              <a href={link} target="_blank" rel="noreferrer" {...stylex.props(app.button)}>
                Buy
              </a>
            ) : null}
            <button type="button" {...stylex.props(app.button)} onClick={() => onAnswer(true)}>Yes</button>
            <Dialog.Close asChild>
              <button type="button" {...stylex.props(app.quiet)}>Not yet</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function ListPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <ListPageInner />
    </Suspense>
  );
}
