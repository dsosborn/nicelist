import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  bandCopy,
  dollars,
  membershipCopy,
  thinBands,
  timingCopy,
  visibilityCopy,
  type OwnerList,
} from "@/lib/api";
import { buildNicelistTools } from "@/lib/webmcp";
import { GiftForm } from "@/components/GiftForm";
import { VisibilityRadio, TimingRadio, MembershipRadio } from "@/components/PhraseRadio";
import { purchasedSummary } from "@/components/ShopperPokeSection";

describe("trial copy and helpers", () => {
  it("uses the exact visibility, timing, membership, and poke band sentences", () => {
    expect(visibilityCopy).toEqual({
      PUBLIC: "Anyone with the link can shop this",
      FRIENDS: "Only friends can open this",
      PRIVATE: "Only me",
    });
    expect(timingCopy).toEqual({
      ANYTIME: "Anytime",
      THIS_SEASON: "This season",
      NEXT_SEASON: "Next season",
      PICK_LATER: "We'll pick a date later",
    });
    expect(membershipCopy).toEqual({
      ANNUAL: "Annual",
      SEASON_PACKAGE: "Season package",
      DIGITAL: "Digital",
    });
    expect(bandCopy).toEqual({
      UNDER_25: "under $25",
      MID: "from $25 to $75",
      OVER_75: "over $75",
    });
    expect(dollars(2499)).toBe("$24.99");
  });

  it("identifies thin price bands and ignores unpriced gifts", () => {
    expect(thinBands([null, undefined, 1000, 1500, 2000])).toEqual(["MID", "OVER_75"]);
    expect(thinBands([1000, 1500])).toContain("UNDER_25");
  });

  it("formats the reveal summary without shopper names", () => {
    const list: OwnerList = {
      id: "l1",
      name: "Christmas",
      visibility: "PUBLIC",
      revealedAt: "2026-12-26T00:00:00Z",
      shareToken: "tok",
      recipientId: "u1",
      recipientName: "Ada",
      isChild: false,
      managing: false,
      pokes: [],
      managers: [],
      gifts: [
        {
          id: "g1",
          kind: "PRODUCT",
          title: "Sweater",
          url: "https://shop.example/s",
          price: 4000,
          notes: null,
          quantity: 2,
          timingPhrase: null,
          membershipPhrase: null,
          createdAt: null,
          slots: [
            { index: 1, status: "PURCHASED" },
            { index: 2, status: "OPEN" },
          ],
          shopperSlots: null,
          openCount: null,
        },
      ],
    };
    expect(purchasedSummary(list)).toBe("1 of 2 were purchased");
  });
});

describe("GiftForm validation and request shaping", () => {
  it("validates product links and custom titles and keeps exact URLs", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<GiftForm onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: "Add gift" }));
    expect(screen.getByRole("alert")).toHaveTextContent("A product needs a link.");
    expect(onAdd).not.toHaveBeenCalled();

    const url = "https://localshop.example/sweater?size=10&color=navy#top";
    await user.type(screen.getByLabelText("Product link"), url);
    await user.click(screen.getByRole("button", { name: "Add gift" }));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "PRODUCT",
        url,
        title: "",
        quantity: 1,
      }),
    );

    await user.click(screen.getByRole("button", { name: "Custom gift" }));
    await user.click(screen.getByRole("button", { name: "Add gift" }));
    expect(screen.getByRole("alert")).toHaveTextContent("A title is required.");
  });

  it("renders radio groups with selection written in words", () => {
    render(
      <>
        <VisibilityRadio value="PUBLIC" onChange={() => {}} />
        <TimingRadio value="NEXT_SEASON" onChange={() => {}} />
        <MembershipRadio value="SEASON_PACKAGE" onChange={() => {}} />
      </>,
    );
    expect(screen.getByText(/Anyone with the link can shop this \(Selected\)/)).toBeInTheDocument();
    expect(screen.getByText(/Next season \(Selected\)/)).toBeInTheDocument();
    expect(screen.getByText(/Season package \(Selected\)/)).toBeInTheDocument();
  });
});

describe("WebMCP tool registry", () => {
  it("registers one read-only tool for a guest on a public list", () => {
    const tools = buildNicelistTools({ signedIn: false, childSafe: false, shareToken: "tok" });
    expect(tools.map((t) => t.name)).toEqual(["nicelist_guest_list"]);
    expect(tools[0].annotations?.readOnlyHint).toBe(true);
  });

  it("registers shopper tools only when viewing a share link and hides claim tools in child-safe view", () => {
    const ownerOnly = buildNicelistTools({ signedIn: true, childSafe: false, shareToken: null });
    expect(ownerOnly.some((t) => t.name === "nicelist_reserve")).toBe(false);
    expect(ownerOnly.some((t) => t.name === "nicelist_shopping_reserve")).toBe(true);
    expect(ownerOnly.some((t) => t.name === "nicelist_pokes")).toBe(true);

    const shoppingShare = buildNicelistTools({ signedIn: true, childSafe: false, shareToken: "tok" });
    expect(shoppingShare.some((t) => t.name === "nicelist_reserve")).toBe(true);
    const poke = shoppingShare.find((t) => t.name === "nicelist_poke");
    expect(poke?.annotations?.destructiveHint).toBe(true);
    const dismiss = shoppingShare.find((t) => t.name === "nicelist_dismiss_poke");
    expect(dismiss?.annotations?.destructiveHint).toBeUndefined();

    const childSafe = buildNicelistTools({ signedIn: true, childSafe: true, shareToken: "tok" });
    expect(childSafe.some((t) => t.name === "nicelist_ideas")).toBe(false);
    expect(childSafe.some((t) => t.name === "nicelist_pokes")).toBe(false);
    expect(childSafe.some((t) => t.name === "nicelist_rate")).toBe(false);
    expect(childSafe.some((t) => t.name === "nicelist_shop_list")).toBe(false);
  });
});
