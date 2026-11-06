// Generated from infra/schema.graphql by infra/scripts/generate-types.mjs. Do not edit by hand.

export type Visibility = "PUBLIC" | "FRIENDS" | "PRIVATE";
export type GiftKind = "PRODUCT" | "CUSTOM" | "EXPERIENCE" | "MEMBERSHIP";
export type TimingPhrase = "ANYTIME" | "THIS_SEASON" | "NEXT_SEASON" | "PICK_LATER";
export type MembershipPhrase = "ANNUAL" | "SEASON_PACKAGE" | "DIGITAL";
export type ClaimStatus = "OPEN" | "RESERVED" | "PURCHASED";
export type PriceBand = "UNDER_25" | "MID" | "OVER_75";
export type PersonKind = "FRIEND" | "CHILD" | "NAME";
export type ReceivedSource = "WISHLIST" | "SUGGESTION";

export type Profile = {
  id: string;
  displayName: string;
  email: string;
};

export type Poke = {
  id: string;
  senderName: string;
  band: PriceBand;
  createdAt: string | null;
};

export type OwnerSlot = {
  index: number;
  status: ClaimStatus;
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

export type OwnerListSummary = {
  id: string;
  name: string;
  visibility: Visibility;
  revealedAt: string | null;
  shareToken: string;
  recipientId: string;
  recipientName: string;
  isChild: boolean;
};

export type OwnerList = {
  id: string;
  name: string;
  visibility: Visibility;
  revealedAt: string | null;
  shareToken: string;
  recipientId: string;
  recipientName: string;
  isChild: boolean;
  managing: boolean;
  gifts: OwnerGift[];
  pokes: Poke[];
  managers: FriendPerson[];
};

export type ShopperSlot = {
  index: number;
  status: ClaimStatus;
  shopperName: string | null;
  shopperNote: string | null;
  claimId: string | null;
  mine: boolean;
};

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
  createdAt: string | null;
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
  myPokes: Poke[];
  canPoke: boolean;
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
  createdAt: string | null;
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

export type FriendPerson = {
  userId: string;
  displayName: string;
};

export type FriendsView = {
  friends: FriendPerson[];
  incoming: FriendPerson[];
  outgoing: FriendPerson[];
};

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

export type ShoppingPersonGifts = {
  personId: string;
  listId: string | null;
  gifts: ShopperGift[];
  openCount: number;
  myPokes: Poke[];
};

export type GiftIdea = {
  title: string;
  price: number;
  reason: string;
  kind: GiftKind;
  timingPhrase: TimingPhrase | null;
  membershipPhrase: MembershipPhrase | null;
  ratingLine: string | null;
};

export type IdeaResult = {
  ideas: GiftIdea[];
  message: string | null;
};

export type ReceivedGift = {
  id: string;
  title: string;
  source: ReceivedSource;
  stars: number | null;
  ratingLine: string | null;
};
