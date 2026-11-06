import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  appendAssociate,
  canPoke,
  claimQuantityChange,
  deleteWindows,
  ideaContext,
  openListError,
  ownerGiftView,
  ownerSeesClaims,
  pickPoke,
  pickReserve,
  ratingDelta,
  ratingLine,
  shapeGuestList,
  shapeMyList,
  shapeReceived,
  shapeShopperList,
  shapeShopping,
  shopperGiftView,
  validateGiftInput,
  visiblePokes,
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

const pokes = [
  { id: "p-sam", listId: "list-1", senderId: "sam", senderName: "Sam", band: "UNDER_25", createdAt: "2026-11-02T00:00:00.000Z" },
  { id: "p-jo", listId: "list-1", senderId: "jo", senderName: "Jo", band: "OVER_75", createdAt: "2026-11-03T00:00:00.000Z" },
];

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
});

test("lowering quantity keeps claimed slots and never tells the owner a gift is taken", () => {
  const mixed = [
    { slot: 1, sk: "g1#0001", status: "RESERVED", shopperId: "sam", giftId: "g1" },
    { slot: 2, sk: "g1#0002", status: "OPEN", giftId: "g1" },
    { slot: 3, sk: "g1#0003", status: "PURCHASED", shopperId: "jo", giftId: "g1" },
  ];
  const dropToOne = claimQuantityChange(mixed, 1, "g1", []);
  assert.equal(dropToOne.error, null);
  assert.deepEqual(
    dropToOne.remove.map((row) => row.slot),
    [2],
  );
  const allClaimed = [
    { slot: 1, sk: "g1#0001", status: "RESERVED", shopperId: "sam", giftId: "g1" },
    { slot: 2, sk: "g1#0002", status: "RESERVED", shopperId: "jo", giftId: "g1" },
  ];
  const dropBelowClaimed = claimQuantityChange(allClaimed, 1, "g1", []);
  assert.equal(dropBelowClaimed.error, null);
  assert.deepEqual(dropBelowClaimed.remove, []);
});

test("idea context and rating line omit shopper identity", () => {
  const context = ideaContext([gift], "MID", { displayName: "Kid", standingNote: "no wool" });
  assert.equal(context.gifts[0].title, "Sweater");
  assert.equal(JSON.stringify(context).includes("Sam"), false);
  assert.equal(ratingLine(9, 45), null);
  assert.equal(ratingLine(10, 50), "People who received this rated it 5 stars.");
});

test("pokes matrix: editor sees all open pokes even before reveal, shopper sees own only, guest sees none", () => {
  const editorBeforeReveal = shapeMyList(adultList, [gift], claims, "ada", "nicelist-20", pokes);
  assert.equal(editorBeforeReveal.pokes.length, 2);
  assert.equal(editorBeforeReveal.pokes[0].senderName, "Sam");
  assert.equal(editorBeforeReveal.pokes[0].band, "UNDER_25");
  assert.equal(editorBeforeReveal.gifts[0].slots, undefined);

  const shopperSam = shapeShopperList(adultList, [gift], claims, "sam", ["ada"], "nicelist-20", pokes);
  assert.equal(shopperSam.myPokes.length, 1);
  assert.equal(shopperSam.myPokes[0].band, "UNDER_25");
  assert.equal(JSON.stringify(shopperSam.myPokes).includes("Jo"), false);

  const shopperOther = shapeShopperList(adultList, [gift], claims, "pat", ["ada"], "nicelist-20", pokes);
  assert.deepEqual(shopperOther.myPokes, []);

  const guest = shapeGuestList(adultList, [gift], claims, "nicelist-20");
  assert.equal(Object.hasOwn(guest, "pokes"), false);
  assert.equal(Object.hasOwn(guest, "myPokes"), false);

  const threeCheap = [
    { ...gift, id: "a", price: 1000 },
    { ...gift, id: "b", price: 1500 },
    { ...gift, id: "c", price: 2000 },
  ];
  const filtered = visiblePokes(pokes, threeCheap);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].band, "OVER_75");
});

test("poke eligibility and idempotence", () => {
  assert.equal(canPoke(adultList, [gift], "sam", ["ada"], "UNDER_25"), true);
  assert.equal(canPoke(adultList, [gift], "ada", ["ada"], "UNDER_25"), false);
  assert.equal(canPoke(adultList, [gift], "stranger", [], "UNDER_25"), false);
  assert.equal(canPoke({ ...adultList, visibility: "PRIVATE" }, [gift], "sam", ["ada"], "UNDER_25"), false);
  const fullBand = [
    { ...gift, id: "a", price: 1000 },
    { ...gift, id: "b", price: 1500 },
    { ...gift, id: "c", price: 2000 },
  ];
  assert.equal(canPoke(adultList, fullBand, "sam", ["ada"], "UNDER_25"), false);

  const childList = { ...adultList, id: "c1", recipientId: "kid", isChild: true, managerIds: ["ada", "beau"] };
  assert.equal(canPoke(childList, [gift], "sam", ["beau"], "UNDER_25"), true);
  assert.equal(canPoke(childList, [gift], "beau", ["ada"], "UNDER_25"), false);

  assert.equal(pickPoke(pokes, "sam", "UNDER_25").action, "existing");
  assert.equal(pickPoke(pokes, "sam", "MID").action, "create");
});

test("purchased suggestions and received gifts are hidden before reveal and expose source after reveal", () => {
  const inbox = [{ sk: "INBOX#plan-1", title: "Blackhawks tickets" }];
  const claimed = [{ giftId: "g1", slot: 1, status: "PURCHASED" }];
  assert.deepEqual(shapeReceived([gift], claimed, inbox, [], false), []);
  const after = shapeReceived([gift], claimed, inbox, [], true);
  assert.equal(after.length, 2);
  assert.equal(after.find((r) => r.id === "g1").source, "WISHLIST");
  assert.equal(after.find((r) => r.id === "plan-1").source, "SUGGESTION");
});

test("open-list check returns not-found before reveal or recipient errors", () => {
  const privateRevealed = { ...adultList, visibility: "PRIVATE", revealedAt: "2026-12-25T00:00:00.000Z" };
  assert.equal(openListError(privateRevealed, "stranger", []), "This list wasn't found.");
  const friendsOwn = { ...adultList, visibility: "FRIENDS" };
  assert.equal(openListError(friendsOwn, "stranger", []), "This list wasn't found.");
  assert.equal(openListError(adultList, "ada", []), "You can't claim a gift on your own list.");
  const publicRevealed = { ...adultList, revealedAt: "2026-12-25T00:00:00.000Z" };
  assert.equal(openListError(publicRevealed, "sam", ["ada"]), "This list is revealed.");
});

test("re-rating a gift adjusts the aggregate by the delta", () => {
  assert.deepEqual(ratingDelta(null, 5), { countDelta: 1, sumDelta: 5 });
  assert.deepEqual(ratingDelta(3, 5), { countDelta: 0, sumDelta: 2 });
});

test("delete windows split claims and gifts into 25-item DynamoDB batches", () => {
  const sixty = Array.from({ length: 60 }, (_, idx) => ({ sk: `k-${idx}` }));
  const windows = deleteWindows(sixty, 3);
  assert.equal(windows.length, 3);
  assert.equal(windows[0].length, 25);
  assert.equal(windows[1].length, 25);
  assert.equal(windows[2].length, 10);
});

test("profile names override stored snapshots and shopping total includes held wishlist claims", () => {
  const profiles = { sam: "Sam Renamed", ada: "Ada Lovelace" };
  const shopper = shapeShopperList(adultList, [gift], claims, "jo", ["ada"], "nicelist-20", [], profiles);
  assert.equal(shopper.recipientName, "Ada Lovelace");
  assert.equal(shopper.gifts[0].slots[0].shopperName, "Sam Renamed");

  const rows = [
    { sk: "LIST", name: "Christmas 2026" },
    { sk: "PERSON#p1", personId: "p1", name: "Ada", personKind: "FRIEND", refId: "ada" },
    { sk: "PLAN#p1#pl1", giftId: "pl1", personId: "p1", kind: "CUSTOM", title: "Book", price: 2000, purchased: false },
  ];
  const shaped = shapeShopping(rows, [{ price: 4000 }]);
  assert.equal(shaped.totalCents, 6000);
});

test("resolver manifest creates profile rows on sign-in and claim writes", () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const manifest = JSON.parse(fs.readFileSync(path.join(here, "../resolver-src/manifest.json"), "utf8"));
  for (const field of ["Query.myLists", "Mutation.reserveGift", "Mutation.setPurchased"]) {
    assert.deepEqual(manifest.pipelines[field].slice(0, 2), ["getProfile", "putProfileIfMissing"]);
  }
});
