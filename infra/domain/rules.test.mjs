import assert from "node:assert/strict";
import test from "node:test";
import {
  appendAssociate,
  claimQuantityChange,
  ideaContext,
  ownerGiftView,
  ownerSeesClaims,
  pickReserve,
  ratingLine,
  shapeGuestList,
  shapeMyList,
  shapeShopperList,
  shopperGiftView,
  validateGiftInput,
} from "./rules.mjs";

const gift = {
  id: "g1",
  kind: "PRODUCT",
  title: "Sweater",
  url: "https://www.amazon.com/dp/B00TEST",
  price: 4000,
  notes: "navy, size M",
  quantity: 2,
  createdAt: "2026-11-01T00:00:00.000Z",
};

const claims = [
  { giftId: "g1", slot: 1, status: "RESERVED", shopperId: "sam", shopperName: "Sam", shopperNote: "the blue one", claimId: "c1" },
  { giftId: "g1", slot: 2, status: "OPEN", claimId: "c2" },
];

const adultList = {
  id: "list-1",
  name: "Christmas",
  visibility: "PUBLIC",
  ownerId: "ada",
  recipientId: "ada",
  recipientName: "Ada",
  managerIds: ["ada"],
  shareToken: "tok",
  isChild: false,
};

test("owner payload before reveal has no claim fields", () => {
  assert.equal(ownerSeesClaims(adultList, "ada"), false);
  const view = ownerGiftView(gift, claims, false);
  assert.equal(Object.hasOwn(view, "slots"), false);
  assert.equal(Object.hasOwn(view, "openCount"), false);
  assert.equal(JSON.stringify(view).includes("Sam"), false);
  assert.equal(JSON.stringify(view).includes("shopper"), false);
  const list = shapeMyList(adultList, [gift], claims, "ada");
  assert.equal(JSON.stringify(list).includes("Sam"), false);
  assert.equal(list.gifts[0].slots, undefined);
});

test("owner payload after reveal shows purchased or open and hides names", () => {
  const revealed = { ...adultList, revealedAt: "2026-12-26T00:00:00.000Z" };
  assert.equal(ownerSeesClaims(revealed, "ada"), true);
  const view = ownerGiftView(gift, claims, true);
  assert.deepEqual(view.slots, [
    { index: 1, status: "OPEN" },
    { index: 2, status: "OPEN" },
  ]);
  const purchased = ownerGiftView(
    gift,
    [{ giftId: "g1", slot: 1, status: "PURCHASED", shopperId: "sam", shopperName: "Sam", claimId: "c1" }],
    true,
  );
  assert.equal(purchased.slots[0].status, "PURCHASED");
  assert.equal(JSON.stringify(purchased).includes("Sam"), false);
  const list = shapeMyList(revealed, [gift], claims, "ada");
  assert.equal(JSON.stringify(list).includes("Sam"), false);
  assert.equal(list.gifts[0].slots[0].status, "OPEN");
});

test("shopper and managing adult payloads include who claimed the gift", () => {
  const shopper = shopperGiftView(gift, claims, "sam", "nicelist-20", false);
  assert.equal(shopper.slots[0].shopperName, "Sam");
  assert.equal(shopper.slots[0].shopperNote, "the blue one");
  assert.equal(shopper.slots[0].mine, true);
  assert.equal(shopper.openCount, 1);
  assert.equal(shopper.url.includes("tag=nicelist-20"), true);
  assert.equal(shopper.url.includes("ascsubtag=c1"), true);

  const child = {
    ...adultList,
    id: "child-list",
    recipientId: "kid",
    recipientName: "Kid",
    isChild: true,
    managerIds: ["ada", "beau"],
  };
  const managed = shapeMyList(child, [gift], claims, "ada");
  assert.equal(managed.managing, true);
  assert.equal(managed.gifts[0].shopperSlots[0].shopperName, "Sam");
  assert.equal(managed.gifts[0].slots, undefined);

  const guest = shapeGuestList(adultList, [gift], claims, "nicelist-20");
  assert.equal(JSON.stringify(guest).includes("Sam"), false);
  assert.equal(guest.gifts[0].reservedCount, 1);
  assert.equal(guest.gifts[0].openCount, 1);
  assert.equal(guest.gifts[0].url.includes("ascsubtag"), false);

  const signedOut = shapeShopperList(adultList, [gift], claims, "jo", [], "nicelist-20");
  assert.equal(signedOut.openCount, 1);
  assert.equal(signedOut.gifts[0].slots[0].shopperName, "Sam");
  assert.equal(shapeShopperList({ ...adultList, visibility: "PRIVATE" }, [gift], claims, "jo", [], ""), null);
});

test("a second reserve of the last quantity is already taken", () => {
  const open = [{ giftId: "g1", slot: 1, status: "OPEN", claimId: "c1" }];
  assert.equal(pickReserve(open, "sam").action, "reserve");
  const held = [{ giftId: "g1", slot: 1, status: "RESERVED", shopperId: "sam", claimId: "c1" }];
  const again = pickReserve(held, "sam");
  assert.equal(again.action, "return");
  assert.equal(again.claimId, "c1");
  const full = [{ giftId: "g1", slot: 1, status: "RESERVED", shopperId: "jo", claimId: "c1" }];
  assert.equal(pickReserve(full, "sam").action, "taken");
});

test("gift validation and associate tags follow the trial rules", () => {
  assert.equal(validateGiftInput({ kind: "PRODUCT", url: "" }).error, "A product needs a link.");
  assert.equal(validateGiftInput({ kind: "CUSTOM", title: "" }).error, "A title is required.");
  assert.equal(validateGiftInput({ kind: "PRODUCT", url: "https://shop.example/sweater" }).error, null);
  assert.equal(
    appendAssociate("https://shop.example/sweater", "nicelist-20", "c1"),
    "https://shop.example/sweater",
  );
  const changed = claimQuantityChange(
    [{ slot: 1, status: "RESERVED", giftId: "g1" }],
    0,
    "g1",
    [],
  );
  assert.equal(changed.error.includes("taken"), true);
});

test("idea context and rating line omit shopper identity", () => {
  const context = ideaContext([gift], "MID", { displayName: "Kid", standingNote: "no wool" });
  assert.equal(context.gifts[0].title, "Sweater");
  assert.equal(JSON.stringify(context).includes("Sam"), false);
  assert.equal(ratingLine(9, 45), null);
  assert.equal(ratingLine(10, 50), "People who received this rated it 5 stars.");
});
