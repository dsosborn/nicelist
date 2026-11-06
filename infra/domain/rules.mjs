const LIMITS = {
  title: 200,
  url: 2048,
  notes: 1000,
  shopperNote: 200,
  standingNote: 500,
  name: 80,
  displayName: 80,
  quantityMax: 10,
  priceMax: 10000000,
  deleteClaims: 50,
  deleteGifts: 25,
  ideaCap: 20,
  ratingCohort: 10,
};

const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function clean(value) {
  if (value === undefined || value === null) return "";
  return ("" + value).trim();
}

function slotKey(giftId, slot) {
  const raw = "" + slot;
  const pad = raw.length >= 4 ? raw : "0000".substring(raw.length) + raw;
  return giftId + "#" + pad;
}

function contains(list, value) {
  if (!list) return false;
  return list.some((item) => item === value);
}

function managerIdsOf(list) {
  if (list && list.managerIds && list.managerIds.length) return list.managerIds;
  if (list && list.ownerId) return [list.ownerId];
  return [];
}

function canManage(list, userId) {
  if (!list || !userId) return false;
  return contains(managerIdsOf(list), userId);
}

function ownerSeesClaims(list, userId) {
  if (!canManage(list, userId)) return false;
  if (list.recipientId !== userId) return true;
  return !!list.revealedAt;
}

function canShop(list, userId, friendIds) {
  if (!list || !userId) return false;
  if (list.recipientId === userId) return false;
  if (canManage(list, userId)) return true;
  if (list.visibility === "PRIVATE") return false;
  if (list.visibility === "PUBLIC") return true;
  if (list.visibility === "FRIENDS") {
    return managerIdsOf(list).some((id) => contains(friendIds, id));
  }
  return false;
}

function validateDisplayName(name) {
  const value = clean(name);
  if (!value) return { error: "Name is required." };
  if (value.length > LIMITS.displayName) return { error: "Name is too long." };
  return { error: null, value: value };
}

function validateListName(name) {
  const value = clean(name);
  if (!value) return { error: "A list needs a name." };
  if (value.length > LIMITS.name) return { error: "Name is too long." };
  return { error: null, value: value };
}

function validateGiftInput(input) {
  const kind = input.kind;
  const title = clean(input.title);
  const url = clean(input.url);
  const notes = clean(input.notes);
  const quantity =
    input.quantity === undefined || input.quantity === null ? 1 : input.quantity;
  if (title.length > LIMITS.title) return { error: "Title is too long." };
  if (url.length > LIMITS.url) return { error: "Link is too long." };
  if (notes.length > LIMITS.notes) return { error: "Notes are too long." };
  if (typeof quantity !== "number" || quantity < 1) {
    return { error: "Quantity must be at least 1." };
  }
  if (quantity > LIMITS.quantityMax) return { error: "Quantity is too high." };
  if (input.price !== undefined && input.price !== null) {
    if (typeof input.price !== "number" || input.price < 0 || input.price > LIMITS.priceMax) {
      return { error: "Price is invalid." };
    }
  }
  if (kind === "PRODUCT") {
    if (!url) return { error: "A product needs a link." };
  } else if (kind === "CUSTOM" || kind === "EXPERIENCE" || kind === "MEMBERSHIP") {
    if (!title) return { error: "A title is required." };
  } else {
    return { error: "Unknown gift type." };
  }
  if (kind === "EXPERIENCE") {
    const phrases = { ANYTIME: 1, THIS_SEASON: 1, NEXT_SEASON: 1, PICK_LATER: 1 };
    if (!phrases[input.timingPhrase]) return { error: "Choose when this experience happens." };
  }
  if (kind === "MEMBERSHIP") {
    const phrases = { ANNUAL: 1, SEASON_PACKAGE: 1, DIGITAL: 1 };
    if (!phrases[input.membershipPhrase]) {
      return { error: "Choose a membership type." };
    }
  }
  return {
    error: null,
    value: {
      kind: kind,
      title: title,
      url: url,
      notes: notes,
      quantity: quantity,
      price: input.price === undefined ? null : input.price,
      timingPhrase: kind === "EXPERIENCE" ? input.timingPhrase : null,
      membershipPhrase: kind === "MEMBERSHIP" ? input.membershipPhrase : null,
    },
  };
}

function validateShopperNote(note) {
  const value = clean(note);
  if (value.length > LIMITS.shopperNote) return { error: "That note is too long." };
  return { error: null, value: value };
}

function isAmazonProduct(url) {
  if (!url) return false;
  const lower = ("" + url).toLowerCase();
  const amazon =
    lower.indexOf("://www.amazon.") !== -1 ||
    lower.indexOf("://amazon.") !== -1 ||
    lower.indexOf("://www.amzn.") !== -1 ||
    lower.indexOf("://amzn.") !== -1 ||
    lower.indexOf("://smile.amazon.") !== -1;
  if (!amazon) return false;
  return (
    lower.indexOf("/dp/") !== -1 ||
    lower.indexOf("/gp/product/") !== -1 ||
    lower.indexOf("/gp/aw/d/") !== -1
  );
}

function encodeQuery(value) {
  const raw = "" + value;
  const allowed = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~";
  return raw.split("").filter((ch) => allowed.indexOf(ch) !== -1).join("");
}

function appendAssociate(url, tag, subtag) {
  if (!url || !tag || !isAmazonProduct(url)) return url || null;
  const hashAt = url.indexOf("#");
  let base = url;
  let hash = "";
  if (hashAt !== -1) {
    base = url.substring(0, hashAt);
    hash = url.substring(hashAt);
  }
  const join = base.indexOf("?") === -1 ? "?" : "&";
  let next = base + join + "tag=" + encodeQuery(tag);
  if (subtag) next = next + "&ascsubtag=" + encodeQuery(subtag);
  return next + hash;
}

function giftFields(gift) {
  return {
    id: gift.id,
    kind: gift.kind,
    title: gift.title || null,
    url: gift.url || null,
    price: gift.price === undefined || gift.price === null || gift.price === "" ? null : gift.price,
    notes: gift.notes || null,
    quantity: gift.quantity,
    timingPhrase: gift.timingPhrase || null,
    membershipPhrase: gift.membershipPhrase || null,
    createdAt: gift.createdAt || null,
  };
}

function sortBySlot(rows) {
  return rows.reduce((acc, row) => {
    const head = acc.filter((item) => item.slot <= row.slot);
    const tail = acc.filter((item) => item.slot > row.slot);
    return head.concat([row]).concat(tail);
  }, []);
}

function sortOpenFirst(rows) {
  return rows.reduce((acc, row) => {
    const rank = row.openCount > 0 ? 0 : 1;
    const head = acc.filter((item) => (item.openCount > 0 ? 0 : 1) <= rank);
    const tail = acc.filter((item) => (item.openCount > 0 ? 0 : 1) > rank);
    return head.concat([row]).concat(tail);
  }, []);
}

function claimsForGift(claims, giftId) {
  const rows = (claims || []).filter((row) => row.giftId === giftId);
  return sortBySlot(rows);
}

function ownerGiftView(gift, claims, showSlots) {
  const view = giftFields(gift);
  if (!showSlots) return view;
  const rows = claimsForGift(claims, gift.id);
  view.slots = rows.map((row) => ({
    index: row.slot,
    status: row.status === "PURCHASED" ? "PURCHASED" : "OPEN",
  }));
  return view;
}

function shopperGiftView(gift, claims, shopperId, tag, onlyMine) {
  const rows = claimsForGift(claims, gift.id);
  const tallied = rows.reduce(
    (acc, row) => {
      const mine = row.shopperId === shopperId && row.status !== "OPEN";
      const skip = onlyMine && row.status !== "OPEN" && !mine;
      const slot = {
        index: row.slot,
        status: row.status,
        shopperName: row.status === "OPEN" ? null : row.shopperName || null,
        shopperNote: row.status === "OPEN" ? null : row.shopperNote || null,
        claimId: row.claimId || null,
        mine: mine,
      };
      return {
        openCount: acc.openCount + (row.status === "OPEN" ? 1 : 0),
        held: mine ? row : acc.held,
        slots: skip ? acc.slots : acc.slots.concat([slot]),
      };
    },
    { openCount: 0, held: null, slots: [] },
  );
  if (onlyMine && tallied.openCount === 0 && !tallied.held) return null;
  const view = giftFields(gift);
  view.url = appendAssociate(gift.url, tag, tallied.held ? tallied.held.claimId : null);
  view.slots = tallied.slots;
  view.openCount = tallied.openCount;
  return view;
}

function guestGiftView(gift, claims, tag) {
  const rows = claimsForGift(claims, gift.id);
  const counts = rows.reduce(
    (acc, row) => ({
      openCount: acc.openCount + (row.status === "OPEN" ? 1 : 0),
      reservedCount: acc.reservedCount + (row.status === "RESERVED" ? 1 : 0),
      purchasedCount: acc.purchasedCount + (row.status === "PURCHASED" ? 1 : 0),
    }),
    { openCount: 0, reservedCount: 0, purchasedCount: 0 },
  );
  const view = giftFields(gift);
  view.url = appendAssociate(gift.url, tag, null);
  view.openCount = counts.openCount;
  view.reservedCount = counts.reservedCount;
  view.purchasedCount = counts.purchasedCount;
  return view;
}

function listSummary(list) {
  return {
    id: list.id,
    name: list.name,
    visibility: list.visibility,
    revealedAt: list.revealedAt || null,
    shareToken: list.shareToken,
    recipientId: list.recipientId,
    recipientName: list.recipientName,
    isChild: !!list.isChild,
  };
}

function shapeShoppingPerson(personId, listId, gifts, claims, userId, tag) {
  const out = (gifts || [])
    .map((row) => shopperGiftView(row, claims, userId, tag, true))
    .filter((gift) => gift);
  const openCount = out.reduce((sum, gift) => sum + gift.openCount, 0);
  return { personId: personId, listId: listId || null, gifts: out, openCount: openCount };
}

function shapeMyList(list, gifts, claims, userId, tag) {
  if (!list) return null;
  const showSlots = ownerSeesClaims(list, userId);
  const asShopper = canManage(list, userId) && list.recipientId !== userId;
  const rows = gifts || [];
  const outGifts = asShopper
    ? rows
        .map((row) => {
          const gift = shopperGiftView(row, claims, userId, tag, false);
          if (!gift) return null;
          const managed = giftFields(row);
          managed.shopperSlots = gift.slots;
          managed.openCount = gift.openCount;
          return managed;
        })
        .filter((gift) => gift)
    : rows.map((row) => ownerGiftView(row, claims, showSlots));
  const summary = listSummary(list);
  summary.gifts = outGifts;
  summary.managing = asShopper;
  return summary;
}

function shapeGuestList(list, gifts, claims, tag) {
  if (!list || list.visibility !== "PUBLIC") return null;
  return {
    name: list.name,
    recipientName: list.recipientName,
    gifts: (gifts || []).map((row) => guestGiftView(row, claims, tag)),
    commissionDisclosure: true,
  };
}

function shapeShopperList(list, gifts, claims, userId, friendIds, tag) {
  if (!list || !canShop(list, userId, friendIds)) return null;
  const out = (gifts || [])
    .map((row) => shopperGiftView(row, claims, userId, tag, false))
    .filter((gift) => gift);
  const openCount = out.reduce((sum, gift) => sum + gift.openCount, 0);
  return {
    id: list.id,
    name: list.name,
    recipientName: list.recipientName,
    visibility: list.visibility,
    revealed: !!list.revealedAt,
    gifts: sortOpenFirst(out),
    openCount: openCount,
    commissionDisclosure: true,
  };
}

function pickReserve(claims, shopperId) {
  const rows = claims || [];
  const mine = rows.find((row) => row.shopperId === shopperId && row.status !== "OPEN");
  if (mine) return { action: "return", slot: mine.slot, claimId: mine.claimId };
  const open = rows.find((row) => row.status === "OPEN");
  if (open) return { action: "reserve", slot: open.slot, claimId: open.claimId };
  return { action: "taken" };
}

function claimSlots(giftId, quantity, claimIds) {
  return SLOTS.filter((slot) => slot <= quantity).map((slot) => ({
    giftId: giftId,
    slot: slot,
    sk: slotKey(giftId, slot),
    status: "OPEN",
    claimId: claimIds[slot - 1],
  }));
}

function claimQuantityChange(existing, quantity, giftId, newClaimIds) {
  const rows = sortBySlot((existing || []).slice());
  if (quantity === rows.length) return { error: null, put: [], remove: [] };
  if (quantity > rows.length) {
    const start = rows.length + 1;
    const put = SLOTS.filter((slot) => slot >= start && slot <= quantity).map((slot) => ({
      giftId: giftId,
      slot: slot,
      sk: slotKey(giftId, slot),
      status: "OPEN",
      claimId: newClaimIds[slot - rows.length - 1],
    }));
    return { error: null, put: put, remove: [] };
  }
  const tail = rows.slice(quantity);
  if (tail.some((row) => row.status !== "OPEN")) {
    return { error: "Quantity can't drop below gifts already taken.", put: [], remove: [] };
  }
  const remove = tail.reduce((acc, row) => [row].concat(acc), []);
  return { error: null, put: [], remove: remove };
}

function bandOf(price) {
  if (price === undefined || price === null) return null;
  if (price < 2500) return "UNDER_25";
  if (price <= 7500) return "MID";
  return "OVER_75";
}

function isThin(gifts, band) {
  const count = (gifts || []).filter((row) => bandOf(row.price) === band).length;
  return count < 3;
}

function ideaContext(gifts, band, extra) {
  const items = (gifts || []).map((row) => ({
    title: row.title || "",
    notes: row.notes || "",
    price: row.price === undefined ? null : row.price,
  }));
  return {
    gifts: items,
    band: band,
    displayName: extra && extra.displayName ? extra.displayName : null,
    standingNote: extra && extra.standingNote ? extra.standingNote : null,
  };
}

function ratingLine(count, sum) {
  if (!count || count < LIMITS.ratingCohort) return null;
  const rounded = Math.round(sum / count);
  return "People who received this rated it " + rounded + " stars.";
}

function normalizeTitle(title) {
  return clean(title).toLowerCase();
}

function personOf(row) {
  return { userId: row.otherId, displayName: row.name || "Someone" };
}

function shapeFriends(rows) {
  const list = rows || [];
  return {
    friends: list.filter((row) => row.sk.indexOf("FRIEND#") === 0).map(personOf),
    incoming: list.filter((row) => row.sk.indexOf("FRIEND_IN#") === 0).map(personOf),
    outgoing: list.filter((row) => row.sk.indexOf("FRIEND_OUT#") === 0).map(personOf),
  };
}

function friendIdsOf(rows) {
  return (rows || [])
    .filter((row) => row.sk.indexOf("FRIEND#") === 0)
    .map((row) => row.otherId);
}

function shapeShopping(rows) {
  return (rows || []).reduce(
    (acc, row) => {
      if (row.sk === "LIST") {
        return {
          name: row.name || acc.name,
          people: acc.people,
          plannedGifts: acc.plannedGifts,
          againClaimIds: acc.againClaimIds,
          totalCents: acc.totalCents,
        };
      }
      if (row.sk.indexOf("PERSON#") === 0) {
        return {
          name: acc.name,
          people: acc.people.concat([
            {
              id: row.personId,
              name: row.name,
              kind: row.personKind,
              refId: row.refId || null,
              standingNote: row.standingNote || null,
            },
          ]),
          plannedGifts: acc.plannedGifts,
          againClaimIds: acc.againClaimIds,
          totalCents: acc.totalCents,
        };
      }
      if (row.sk.indexOf("PLAN#") === 0) {
        const price = typeof row.price === "number" ? row.price : 0;
        return {
          name: acc.name,
          people: acc.people,
          plannedGifts: acc.plannedGifts.concat([
            {
              id: row.giftId,
              personId: row.personId,
              kind: row.kind,
              title: row.title || null,
              url: row.url || null,
              price: row.price === undefined ? null : row.price,
              notes: row.notes || null,
              timingPhrase: row.timingPhrase || null,
              membershipPhrase: row.membershipPhrase || null,
              purchased: !!row.purchased,
              againNextYear: !!row.againNextYear,
            },
          ]),
          againClaimIds: acc.againClaimIds,
          totalCents: acc.totalCents + price,
        };
      }
      if (row.sk.indexOf("AGAIN#") === 0 && row.on) {
        return {
          name: acc.name,
          people: acc.people,
          plannedGifts: acc.plannedGifts,
          againClaimIds: acc.againClaimIds.concat([row.sk.substring(6)]),
          totalCents: acc.totalCents,
        };
      }
      return acc;
    },
    {
      name: "Christmas 2026",
      people: [],
      plannedGifts: [],
      againClaimIds: [],
      totalCents: 0,
    },
  );
}

function shapeReceived(gifts, claims, inbox, ratings) {
  const ratingRows = ratings || [];
  const starsById = {};
  ratingRows
    .filter((row) => row.sk.indexOf("RATE#") === 0)
    .forEach((row) => {
      starsById[row.sk.substring(5)] = row.stars;
    });
  const lines = {};
  ratingRows
    .filter((row) => row.recipientId === "AGG")
    .forEach((row) => {
      lines[row.sk] = ratingLine(row.ratingCount, row.ratingSum);
    });
  const titles = {};
  (gifts || []).forEach((row) => {
    titles[row.id] = row.title || "A gift";
  });
  const seen = {};
  const fromClaims = (claims || [])
    .filter((claim) => {
      if (claim.status !== "PURCHASED" || seen[claim.giftId]) return false;
      seen[claim.giftId] = true;
      return true;
    })
    .map((claim) => {
      const title = titles[claim.giftId] || "A gift";
      return {
        id: claim.giftId,
        title: title,
        stars: starsById[claim.giftId] === undefined ? null : starsById[claim.giftId],
        ratingLine: lines[normalizeTitle(title)] || null,
      };
    });
  const fromInbox = (inbox || [])
    .filter((row) => row.sk.indexOf("INBOX#") === 0)
    .map((row) => {
      const id = row.sk.substring(6);
      return {
        id: id,
        title: row.title || "A gift",
        stars: starsById[id] === undefined ? null : starsById[id],
        ratingLine: lines[normalizeTitle(row.title || "")] || null,
      };
    });
  return fromClaims.concat(fromInbox);
}

function chunk(items, size) {
  const list = items || [];
  return list.reduce((acc, item, index) => {
    if (index % size === 0) return acc.concat([[item]]);
    const head = acc.slice(0, acc.length - 1);
    const last = acc[acc.length - 1].concat([item]);
    return head.concat([last]);
  }, []);
}

function displayNameFrom(name, email) {
  const named = clean(name);
  if (named) return named.substring(0, LIMITS.displayName);
  const mail = clean(email);
  const at = mail.indexOf("@");
  const local = at === -1 ? mail : mail.substring(0, at);
  return local || "Someone";
}

function normalizeEmail(email) {
  return clean(email).toLowerCase();
}

export {
  LIMITS,
  clean,
  slotKey,
  contains,
  managerIdsOf,
  canManage,
  ownerSeesClaims,
  canShop,
  validateDisplayName,
  validateListName,
  validateGiftInput,
  validateShopperNote,
  isAmazonProduct,
  appendAssociate,
  ownerGiftView,
  shopperGiftView,
  guestGiftView,
  listSummary,
  shapeMyList,
  shapeShoppingPerson,
  shapeGuestList,
  shapeShopperList,
  pickReserve,
  claimSlots,
  claimQuantityChange,
  bandOf,
  isThin,
  ideaContext,
  ratingLine,
  normalizeTitle,
  shapeFriends,
  friendIdsOf,
  shapeShopping,
  shapeReceived,
  chunk,
  displayNameFrom,
  normalizeEmail,
};
