import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { app } from "@/app/appStyles";
import { BuyDialog } from "@/components/BuyDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { GiftForm } from "@/components/GiftForm";
import { ListMenu } from "@/components/ListMenu";
import {
  MembershipRadio,
  TimingRadio,
  VisibilityRadio,
} from "@/components/PhraseRadio";
import { ShopperPokeSection } from "@/components/ShopperPokeSection";
import type {
  MembershipPhrase,
  ShopperGift,
  TimingPhrase,
  Visibility,
} from "@/lib/api";

const meta = {
  title: "Nicelist/Trial Composites",
};

export default meta;

const sampleGift: ShopperGift = {
  id: "gift-1",
  kind: "PRODUCT",
  title: "Navy cable sweater",
  url: "https://www.amazon.com/dp/B00SWEATER?tag=nicelist-20&ascsubtag=claim-1",
  price: 4500,
  notes: "Size M, navy",
  quantity: 1,
  timingPhrase: null,
  membershipPhrase: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  openCount: 0,
  slots: [
    {
      index: 1,
      status: "RESERVED",
      shopperName: "Sam",
      shopperNote: "getting the blue one",
      claimId: "claim-1",
      mine: true,
    },
  ],
};

export const DidYouBuyItDialog = {
  render: function RenderBuyDialog() {
    const [open, setOpen] = useState(true);
    const [status, setStatus] = useState<"RESERVED" | "PURCHASED">("RESERVED");
    const [note, setNote] = useState("");
    return (
      <div {...stylex.props(app.page)}>
        <p data-testid="gift-status">
          Status: {status === "PURCHASED" ? "Purchased" : "Reserved"}
        </p>
        <button
          type="button"
          {...stylex.props(app.button)}
          onClick={() => setOpen(true)}
        >
          Did you buy it?
        </button>
        {open ? (
          <BuyDialog
            gift={sampleGift}
            note={note}
            setNote={setNote}
            onAnswer={(bought) => {
              if (bought) setStatus("PURCHASED");
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </div>
    );
  },
};

export const DestructiveConfirmDialog = {
  render: function RenderConfirmDialog() {
    const [deleted, setDeleted] = useState(false);
    return (
      <div {...stylex.props(app.page)}>
        <p data-testid="delete-state">{deleted ? "Deleted" : "Kept"}</p>
        <ConfirmDialog
          title="Delete this gift?"
          description="This also removes its reservation."
          confirmLabel="Delete gift"
          onConfirm={() => setDeleted(true)}
        >
          <button type="button" {...stylex.props(app.quiet)}>
            Delete gift
          </button>
        </ConfirmDialog>
      </div>
    );
  },
};

export const SentenceRadios = {
  render: function RenderRadios() {
    const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
    const [timing, setTiming] = useState<TimingPhrase>("ANYTIME");
    const [membership, setMembership] = useState<MembershipPhrase>("ANNUAL");
    return (
      <div {...stylex.props(app.page)}>
        <VisibilityRadio value={visibility} onChange={setVisibility} />
        <TimingRadio value={timing} onChange={setTiming} />
        <MembershipRadio value={membership} onChange={setMembership} />
      </div>
    );
  },
};

export const SwitchListMenu = {
  render: function RenderListMenu() {
    return (
      <div {...stylex.props(app.page)}>
        <ListMenu
          lists={[
            {
              id: "l1",
              name: "Christmas",
              visibility: "PUBLIC",
              revealedAt: null,
              shareToken: "t1",
              recipientId: "u1",
              recipientName: "Ada",
              isChild: false,
            },
            {
              id: "l2",
              name: "Leo",
              visibility: "PUBLIC",
              revealedAt: null,
              shareToken: "t2",
              recipientId: "c1",
              recipientName: "Leo",
              isChild: true,
            },
          ]}
        />
      </div>
    );
  },
};

export const AddGiftDisclosure = {
  render: function RenderGiftForm() {
    return (
      <div {...stylex.props(app.page)}>
        <GiftForm onAdd={async () => {}} />
      </div>
    );
  },
};

export const PokesAndStatusWords = {
  render: function RenderPokes() {
    return (
      <div {...stylex.props(app.page)}>
        <div {...stylex.props(app.card)}>
          <strong>The navy sweater at the shop on Oak</strong>
          <p>Oak Street Menswear, size 10, the blue one</p>
          <p {...stylex.props(app.statusOpen)}>Available</p>
          <p {...stylex.props(app.statusTaken)}>
            Taken by Sam — getting the blue one
          </p>
          <p {...stylex.props(app.statusBought)}>Bought by Jo</p>
        </div>
        <ShopperPokeSection
          listId="l1"
          recipientName="Sam"
          bands={["UNDER_25", "MID"]}
          myPokes={[
            {
              id: "p1",
              senderName: "Ada",
              band: "UNDER_25",
              createdAt: "2026-11-05T00:00:00Z",
            },
          ]}
          onPoked={async () => {}}
        />
      </div>
    );
  },
};
