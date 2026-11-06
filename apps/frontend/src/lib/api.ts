"use client";

import "@/lib/amplify";

import { generateClient } from "aws-amplify/api";

const client = generateClient();

type GqlError = { message?: string };
type GqlResult<T> = { data?: T; errors?: GqlError[] };

export class ApiError extends Error {}

function messageOf(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (err as { errors?: { message?: string }[] }).errors;
    if (errors && errors[0] && errors[0].message) return errors[0].message;
  }
  return "Something went wrong.";
}

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  authMode: "userPool" | "apiKey" = "userPool",
): Promise<T> {
  let result: GqlResult<T>;
  try {
    result = (await client.graphql({
      query,
      variables,
      authMode,
    })) as GqlResult<T>;
  } catch (err) {
    throw new ApiError(messageOf(err));
  }
  if (result.errors?.length) {
    throw new ApiError(result.errors[0].message || "Something went wrong.");
  }
  if (!result.data) throw new ApiError("Something went wrong.");
  return result.data;
}

export type Visibility = "PUBLIC" | "FRIENDS" | "PRIVATE";
export type GiftKind = "PRODUCT" | "CUSTOM" | "EXPERIENCE" | "MEMBERSHIP";
export type TimingPhrase = "ANYTIME" | "THIS_SEASON" | "NEXT_SEASON" | "PICK_LATER";
export type MembershipPhrase = "ANNUAL" | "SEASON_PACKAGE" | "DIGITAL";
export type PriceBand = "UNDER_25" | "MID" | "OVER_75";
export type PersonKind = "FRIEND" | "CHILD" | "NAME";

export type Profile = { id: string; displayName: string; email: string };

export type ListSummary = {
  id: string;
  name: string;
  visibility: Visibility;
  revealedAt: string | null;
  shareToken: string;
  recipientId: string;
  recipientName: string;
  isChild: boolean;
};

export type OwnerSlot = { index: number; status: "OPEN" | "RESERVED" | "PURCHASED" };
export type ShopperSlot = {
  index: number;
  status: "OPEN" | "RESERVED" | "PURCHASED";
  shopperName: string | null;
  shopperNote: string | null;
  claimId: string | null;
  mine: boolean;
};

export type OwnerGift = {
  id: string;
  kind: GiftKind;
  title: string | null;
  url: string | null;
  price: number | null;
  notes: string | null;
  quantity: number;
  timingPhrase: TimingPhrase | null;
  membershipPhrase: MembershipPhrase | null;
  createdAt: string | null;
  slots: OwnerSlot[] | null;
  shopperSlots: ShopperSlot[] | null;
  openCount: number | null;
};

export type OwnerList = ListSummary & { managing: boolean; gifts: OwnerGift[] };

export type ShopperGift = {
  id: string;
  kind: GiftKind;
  title: string | null;
  url: string | null;
  price: number | null;
  notes: string | null;
  quantity: number;
  timingPhrase: TimingPhrase | null;
  membershipPhrase: MembershipPhrase | null;
  slots: ShopperSlot[];
  openCount: number;
};

export type ShopperList = {
  id: string;
  name: string;
  recipientName: string;
  visibility: Visibility;
  revealed: boolean;
  gifts: ShopperGift[];
  openCount: number;
  commissionDisclosure: boolean;
};

export type GuestGift = {
  id: string;
  kind: GiftKind;
  title: string | null;
  url: string | null;
  price: number | null;
  notes: string | null;
  quantity: number;
  timingPhrase: TimingPhrase | null;
  membershipPhrase: MembershipPhrase | null;
  openCount: number;
  reservedCount: number;
  purchasedCount: number;
};

export type GuestList = {
  name: string;
  recipientName: string;
  gifts: GuestGift[];
  commissionDisclosure: boolean;
};

export type GiftInput = {
  kind: GiftKind;
  title?: string;
  url?: string;
  price?: number | null;
  notes?: string;
  quantity?: number;
  timingPhrase?: TimingPhrase | null;
  membershipPhrase?: MembershipPhrase | null;
};

const summaryFields = `
  id name visibility revealedAt shareToken recipientId recipientName isChild
`;

const ownerGiftFields = `
  id kind title url price notes quantity timingPhrase membershipPhrase createdAt
  slots { index status }
  shopperSlots { index status shopperName shopperNote claimId mine }
  openCount
`;

export async function fetchMe() {
  const data = await gql<{ me: Profile }>(`query { me { id displayName email } }`);
  return data.me;
}

export async function updateProfile(displayName: string) {
  const data = await gql<{ updateProfile: Profile }>(
    `mutation ($displayName: String!) { updateProfile(displayName: $displayName) { id displayName email } }`,
    { displayName },
  );
  return data.updateProfile;
}

export async function fetchMyLists() {
  const data = await gql<{ myLists: ListSummary[] }>(
    `query { myLists { ${summaryFields} } }`,
  );
  return data.myLists;
}

export async function fetchMyList(id: string) {
  const data = await gql<{ myList: OwnerList | null }>(
    `query ($id: ID!) { myList(id: $id) { ${summaryFields} managing gifts { ${ownerGiftFields} } } }`,
    { id },
  );
  return data.myList;
}

export async function createList(name: string) {
  const data = await gql<{ createList: ListSummary }>(
    `mutation ($name: String!) { createList(name: $name) { ${summaryFields} } }`,
    { name },
  );
  return data.createList;
}

export async function renameList(id: string, name: string) {
  const data = await gql<{ renameList: ListSummary }>(
    `mutation ($id: ID!, $name: String!) { renameList(id: $id, name: $name) { ${summaryFields} } }`,
    { id, name },
  );
  return data.renameList;
}

export async function setListVisibility(id: string, visibility: Visibility) {
  const data = await gql<{ setListVisibility: ListSummary }>(
    `mutation ($id: ID!, $visibility: Visibility!) { setListVisibility(id: $id, visibility: $visibility) { ${summaryFields} } }`,
    { id, visibility },
  );
  return data.setListVisibility;
}

export async function rotateShareToken(id: string) {
  const data = await gql<{ rotateShareToken: ListSummary }>(
    `mutation ($id: ID!) { rotateShareToken(id: $id) { ${summaryFields} } }`,
    { id },
  );
  return data.rotateShareToken;
}

export async function deleteList(id: string) {
  const data = await gql<{ deleteList: ListSummary }>(
    `mutation ($id: ID!) { deleteList(id: $id) { id name } }`,
    { id },
  );
  return data.deleteList;
}

export async function revealList(id: string) {
  const data = await gql<{ revealList: OwnerList }>(
    `mutation ($id: ID!) { revealList(id: $id) { ${summaryFields} managing gifts { ${ownerGiftFields} } } }`,
    { id },
  );
  return data.revealList;
}

export async function addChild(name: string) {
  const data = await gql<{ addChild: ListSummary }>(
    `mutation ($name: String!) { addChild(name: $name) { ${summaryFields} } }`,
    { name },
  );
  return data.addChild;
}

export async function removeChild(childId: string) {
  await gql(`mutation ($childId: ID!) { removeChild(childId: $childId) }`, { childId });
}

export async function inviteCoManager(childId: string, email: string) {
  await gql(
    `mutation ($childId: ID!, $email: String!) { inviteCoManager(childId: $childId, email: $email) }`,
    { childId, email },
  );
}

export async function removeCoManager(childId: string, userId: string) {
  await gql(
    `mutation ($childId: ID!, $userId: ID!) { removeCoManager(childId: $childId, userId: $userId) }`,
    { childId, userId },
  );
}

function giftVars(input: GiftInput) {
  return {
    kind: input.kind,
    title: input.title ?? null,
    url: input.url ?? null,
    price: input.price ?? null,
    notes: input.notes ?? null,
    quantity: input.quantity ?? null,
    timingPhrase: input.timingPhrase ?? null,
    membershipPhrase: input.membershipPhrase ?? null,
  };
}

const giftArgs = `
  $kind: GiftKind!
  $title: String
  $url: String
  $price: Int
  $notes: String
  $quantity: Int
  $timingPhrase: TimingPhrase
  $membershipPhrase: MembershipPhrase
`;

const giftPass = `
  kind: $kind
  title: $title
  url: $url
  price: $price
  notes: $notes
  quantity: $quantity
  timingPhrase: $timingPhrase
  membershipPhrase: $membershipPhrase
`;

export async function addGift(listId: string, input: GiftInput) {
  const data = await gql<{ addGift: OwnerGift }>(
    `mutation ($listId: ID!, ${giftArgs}) { addGift(listId: $listId, ${giftPass}) { ${ownerGiftFields} } }`,
    { listId, ...giftVars(input) },
  );
  return data.addGift;
}

export async function updateGift(listId: string, id: string, input: GiftInput) {
  const data = await gql<{ updateGift: OwnerGift }>(
    `mutation ($listId: ID!, $id: ID!, ${giftArgs}) { updateGift(listId: $listId, id: $id, ${giftPass}) { ${ownerGiftFields} } }`,
    { listId, id, ...giftVars(input) },
  );
  return data.updateGift;
}

export async function deleteGift(listId: string, id: string) {
  const data = await gql<{ deleteGift: OwnerGift }>(
    `mutation ($listId: ID!, $id: ID!) { deleteGift(listId: $listId, id: $id) { id title } }`,
    { listId, id },
  );
  return data.deleteGift;
}

const shopperGiftFields = `
  id kind title url price notes quantity timingPhrase membershipPhrase
  openCount
  slots { index status shopperName shopperNote claimId mine }
`;

export async function fetchGuestList(token: string) {
  const data = await gql<{ guestList: GuestList | null }>(
    `query ($token: String!) {
      guestList(token: $token) {
        name recipientName commissionDisclosure
        gifts { id kind title url price notes quantity timingPhrase membershipPhrase openCount reservedCount purchasedCount }
      }
    }`,
    { token },
    "apiKey",
  );
  return data.guestList;
}

export async function fetchShopList(token: string) {
  const data = await gql<{ shopList: ShopperList | null }>(
    `query ($token: String!) {
      shopList(token: $token) {
        id name recipientName visibility revealed openCount commissionDisclosure
        gifts { ${shopperGiftFields} }
      }
    }`,
    { token },
  );
  return data.shopList;
}

export async function reserveGift(listId: string, giftId: string, note?: string) {
  const data = await gql<{ reserveGift: ShopperGift }>(
    `mutation ($listId: ID!, $giftId: ID!, $note: String) {
      reserveGift(listId: $listId, giftId: $giftId, note: $note) { ${shopperGiftFields} }
    }`,
    { listId, giftId, note: note ?? null },
  );
  return data.reserveGift;
}

export async function setPurchased(
  listId: string,
  giftId: string,
  slot: number,
  purchased: boolean,
  note?: string,
) {
  const data = await gql<{ setPurchased: ShopperGift }>(
    `mutation ($listId: ID!, $giftId: ID!, $slot: Int!, $purchased: Boolean!, $note: String) {
      setPurchased(listId: $listId, giftId: $giftId, slot: $slot, purchased: $purchased, note: $note) { ${shopperGiftFields} }
    }`,
    { listId, giftId, slot, purchased, note: note ?? null },
  );
  return data.setPurchased;
}

export async function releaseGift(listId: string, giftId: string, slot: number) {
  const data = await gql<{ releaseGift: ShopperGift }>(
    `mutation ($listId: ID!, $giftId: ID!, $slot: Int!) {
      releaseGift(listId: $listId, giftId: $giftId, slot: $slot) { ${shopperGiftFields} }
    }`,
    { listId, giftId, slot },
  );
  return data.releaseGift;
}

export type FriendPerson = { userId: string; displayName: string };
export type FriendsView = {
  friends: FriendPerson[];
  incoming: FriendPerson[];
  outgoing: FriendPerson[];
};

const friendsQuery = `query { friends { friends { userId displayName } incoming { userId displayName } outgoing { userId displayName } } }`;

export async function fetchFriends() {
  const data = await gql<{ friends: FriendsView }>(friendsQuery);
  return data.friends;
}

export async function sendFriendRequest(email: string) {
  const data = await gql<{ sendFriendRequest: FriendsView }>(
    `mutation ($email: String!) { sendFriendRequest(email: $email) { friends { userId displayName } incoming { userId displayName } outgoing { userId displayName } } }`,
    { email },
  );
  return data.sendFriendRequest;
}

export async function acceptFriendRequest(userId: string) {
  const data = await gql<{ acceptFriendRequest: FriendsView }>(
    `mutation ($userId: ID!) { acceptFriendRequest(userId: $userId) { friends { userId displayName } incoming { userId displayName } outgoing { userId displayName } } }`,
    { userId },
  );
  return data.acceptFriendRequest;
}

export async function declineFriendRequest(userId: string) {
  const data = await gql<{ declineFriendRequest: FriendsView }>(
    `mutation ($userId: ID!) { declineFriendRequest(userId: $userId) { friends { userId displayName } incoming { userId displayName } outgoing { userId displayName } } }`,
    { userId },
  );
  return data.declineFriendRequest;
}

export async function cancelFriendRequest(userId: string) {
  const data = await gql<{ cancelFriendRequest: FriendsView }>(
    `mutation ($userId: ID!) { cancelFriendRequest(userId: $userId) { friends { userId displayName } incoming { userId displayName } outgoing { userId displayName } } }`,
    { userId },
  );
  return data.cancelFriendRequest;
}

export async function removeFriend(userId: string) {
  const data = await gql<{ removeFriend: FriendsView }>(
    `mutation ($userId: ID!) { removeFriend(userId: $userId) { friends { userId displayName } incoming { userId displayName } outgoing { userId displayName } } }`,
    { userId },
  );
  return data.removeFriend;
}

export type ShoppingPerson = {
  id: string;
  name: string;
  kind: PersonKind;
  refId: string | null;
  standingNote: string | null;
};

export type PlannedGift = {
  id: string;
  personId: string;
  kind: GiftKind;
  title: string | null;
  url: string | null;
  price: number | null;
  notes: string | null;
  timingPhrase: TimingPhrase | null;
  membershipPhrase: MembershipPhrase | null;
  purchased: boolean;
  againNextYear: boolean;
};

export type ShoppingList = {
  name: string;
  people: ShoppingPerson[];
  plannedGifts: PlannedGift[];
  againClaimIds: string[];
  totalCents: number;
};

const shoppingFields = `
  name totalCents againClaimIds
  people { id name kind refId standingNote }
  plannedGifts { id personId kind title url price notes timingPhrase membershipPhrase purchased againNextYear }
`;

export async function fetchShoppingList() {
  const data = await gql<{ shoppingList: ShoppingList }>(
    `query { shoppingList { ${shoppingFields} } }`,
  );
  return data.shoppingList;
}

export async function renameShoppingList(name: string) {
  const data = await gql<{ renameShoppingList: ShoppingList }>(
    `mutation ($name: String!) { renameShoppingList(name: $name) { ${shoppingFields} } }`,
    { name },
  );
  return data.renameShoppingList;
}

export async function addShoppingPerson(name: string, kind: PersonKind, refId?: string) {
  const data = await gql<{ addShoppingPerson: ShoppingPerson }>(
    `mutation ($name: String!, $kind: PersonKind!, $refId: ID) {
      addShoppingPerson(name: $name, kind: $kind, refId: $refId) { id name kind refId standingNote }
    }`,
    { name, kind, refId: refId ?? null },
  );
  return data.addShoppingPerson;
}

export async function removeShoppingPerson(personId: string) {
  await gql(`mutation ($personId: ID!) { removeShoppingPerson(personId: $personId) }`, { personId });
}

export async function setStandingNote(personId: string, note: string) {
  const data = await gql<{ setStandingNote: ShoppingPerson }>(
    `mutation ($personId: ID!, $note: String!) { setStandingNote(personId: $personId, note: $note) { id name kind refId standingNote } }`,
    { personId, note },
  );
  return data.setStandingNote;
}

export async function addPlannedGift(personId: string, input: GiftInput) {
  const data = await gql<{ addPlannedGift: PlannedGift }>(
    `mutation ($personId: ID!, ${giftArgs}) {
      addPlannedGift(personId: $personId, ${giftPass}) {
        id personId kind title url price notes timingPhrase membershipPhrase purchased againNextYear
      }
    }`,
    { personId, ...giftVars(input) },
  );
  return data.addPlannedGift;
}

export async function updatePlannedGift(
  personId: string,
  id: string,
  input: Pick<GiftInput, "title" | "url" | "price" | "notes" | "timingPhrase" | "membershipPhrase">,
) {
  const data = await gql<{ updatePlannedGift: PlannedGift }>(
    `mutation ($personId: ID!, $id: ID!, $title: String, $url: String, $price: Int, $notes: String, $timingPhrase: TimingPhrase, $membershipPhrase: MembershipPhrase) {
      updatePlannedGift(personId: $personId, id: $id, title: $title, url: $url, price: $price, notes: $notes, timingPhrase: $timingPhrase, membershipPhrase: $membershipPhrase) {
        id personId kind title url price notes timingPhrase membershipPhrase purchased againNextYear
      }
    }`,
    {
      personId,
      id,
      title: input.title ?? null,
      url: input.url ?? null,
      price: input.price ?? null,
      notes: input.notes ?? null,
      timingPhrase: input.timingPhrase ?? null,
      membershipPhrase: input.membershipPhrase ?? null,
    },
  );
  return data.updatePlannedGift;
}

export async function deletePlannedGift(personId: string, id: string) {
  await gql(
    `mutation ($personId: ID!, $id: ID!) { deletePlannedGift(personId: $personId, id: $id) { id } }`,
    { personId, id },
  );
}

export async function setPlannedPurchased(personId: string, id: string, purchased: boolean) {
  const data = await gql<{ setPlannedPurchased: PlannedGift }>(
    `mutation ($personId: ID!, $id: ID!, $purchased: Boolean!) {
      setPlannedPurchased(personId: $personId, id: $id, purchased: $purchased) {
        id personId kind title url price notes timingPhrase membershipPhrase purchased againNextYear
      }
    }`,
    { personId, id, purchased },
  );
  return data.setPlannedPurchased;
}

export async function setAgainNextYear(claimId: string, personId: string, again: boolean) {
  await gql(
    `mutation ($claimId: ID!, $personId: ID!, $again: Boolean!) { setAgainNextYear(claimId: $claimId, personId: $personId, again: $again) }`,
    { claimId, personId, again },
  );
}

export async function deleteShoppingList() {
  await gql(`mutation { deleteShoppingList }`);
}

export async function fetchShoppingPerson(personId: string) {
  const data = await gql<{
    shoppingPerson: { personId: string; listId: string | null; gifts: ShopperGift[]; openCount: number } | null;
  }>(
    `query ($personId: ID!) { shoppingPerson(personId: $personId) { personId listId openCount gifts { ${shopperGiftFields} } } }`,
    { personId },
  );
  return data.shoppingPerson;
}

export type GiftIdea = {
  title: string;
  price: number;
  reason: string;
  kind: GiftKind;
  timingPhrase: TimingPhrase | null;
  membershipPhrase: MembershipPhrase | null;
  ratingLine: string | null;
};

export async function askForIdeas(listId: string, band: PriceBand) {
  const data = await gql<{ askForIdeas: { ideas: GiftIdea[]; message: string | null } }>(
    `mutation ($listId: ID!, $band: PriceBand!) {
      askForIdeas(listId: $listId, band: $band) {
        message
        ideas { title price reason kind timingPhrase membershipPhrase ratingLine }
      }
    }`,
    { listId, band },
  );
  return data.askForIdeas;
}

export async function askForShoppingIdeas(personId: string, band: PriceBand) {
  const data = await gql<{ askForShoppingIdeas: { ideas: GiftIdea[]; message: string | null } }>(
    `mutation ($personId: ID!, $band: PriceBand!) {
      askForShoppingIdeas(personId: $personId, band: $band) {
        message
        ideas { title price reason kind timingPhrase membershipPhrase ratingLine }
      }
    }`,
    { personId, band },
  );
  return data.askForShoppingIdeas;
}

export type ReceivedGift = { id: string; title: string; stars: number | null; ratingLine: string | null };

export async function fetchReceivedGifts() {
  const data = await gql<{ receivedGifts: ReceivedGift[] }>(
    `query { receivedGifts { id title stars ratingLine } }`,
  );
  return data.receivedGifts;
}

export async function rateGift(listId: string, giftId: string, stars: number) {
  const data = await gql<{ rateGift: ReceivedGift }>(
    `mutation ($listId: ID!, $giftId: ID!, $stars: Int!) { rateGift(listId: $listId, giftId: $giftId, stars: $stars) { id title stars ratingLine } }`,
    { listId, giftId, stars },
  );
  return data.rateGift;
}

export async function rateSuggestion(id: string, stars: number) {
  const data = await gql<{ rateSuggestion: ReceivedGift }>(
    `mutation ($id: ID!, $stars: Int!) { rateSuggestion(id: $id, stars: $stars) { id title stars ratingLine } }`,
    { id, stars },
  );
  return data.rateSuggestion;
}

export function bandOf(price: number | null | undefined): PriceBand | null {
  if (price === null || price === undefined) return null;
  if (price < 2500) return "UNDER_25";
  if (price <= 7500) return "MID";
  return "OVER_75";
}

export function thinBands(prices: Array<number | null | undefined>) {
  const counts: Record<PriceBand, number> = { UNDER_25: 0, MID: 0, OVER_75: 0 };
  for (const price of prices) {
    const band = bandOf(price);
    if (band) counts[band] += 1;
  }
  return (Object.keys(counts) as PriceBand[]).filter((band) => counts[band] < 3);
}

export function dollars(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return "";
  return `$${(cents / 100).toFixed(2)}`;
}

export const visibilityCopy: Record<Visibility, string> = {
  PUBLIC: "Anyone with the link can shop this",
  FRIENDS: "Only friends can open this",
  PRIVATE: "Only me",
};

export const timingCopy: Record<TimingPhrase, string> = {
  ANYTIME: "Anytime",
  THIS_SEASON: "This season",
  NEXT_SEASON: "Next season",
  PICK_LATER: "We'll pick a date later",
};

export const membershipCopy: Record<MembershipPhrase, string> = {
  ANNUAL: "Annual",
  SEASON_PACKAGE: "Season package",
  DIGITAL: "Digital",
};
