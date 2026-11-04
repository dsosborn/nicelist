import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const claims = ctx.identity && ctx.identity.claims ? ctx.identity.claims : {};
  ctx.stash.userId = ctx.identity ? ctx.identity.sub : null;
  ctx.stash.email = claims.email || "";
  ctx.stash.givenName = claims.name || "";
  ctx.stash.associateTag = "${associate_tag}";
  const field = ctx.info.fieldName;
  const shapes = {
    myList: "myList",
    revealList: "myList",
    guestList: "guest",
    shopList: "shop",
    friends: "friends",
    sendFriendRequest: "friends",
    acceptFriendRequest: "friends",
    declineFriendRequest: "friends",
    cancelFriendRequest: "friends",
    removeFriend: "friends",
    shoppingList: "shopping",
    renameShoppingList: "shopping",
    shoppingPerson: "shoppingPerson",
    askForIdeas: "ideas",
    askForShoppingIdeas: "ideas",
    receivedGifts: "received",
  };
  ctx.stash.shape = shapes[field] || "";
  if (ctx.args && ctx.args.giftId) ctx.stash.giftId = ctx.args.giftId;
  if (ctx.args && ctx.args.id && (field === "updateGift" || field === "deleteGift" || field === "rateGift")) {
    ctx.stash.giftId = ctx.args.id;
  }
  return {};
}

export function response(ctx) {
  const stash = ctx.stash;
  if (stash.shape === "myList") {
    if (!stash.list || stash.notFound) return null;
    return shapeMyList(stash.list, stash.gifts || [], stash.claims || [], stash.userId, stash.associateTag);
  }
  if (stash.shape === "guest") {
    if (!stash.list || stash.notFound) return null;
    return shapeGuestList(stash.list, stash.gifts || [], stash.claims || [], stash.associateTag);
  }
  if (stash.shape === "shop") {
    if (!stash.list || stash.notFound) return null;
    return shapeShopperList(
      stash.list,
      stash.gifts || [],
      stash.claims || [],
      stash.userId,
      stash.friendIds || [],
      stash.associateTag,
    );
  }
  if (stash.shape === "friends") return shapeFriends(stash.rows || []);
  if (stash.shape === "shopping") return shapeShopping(stash.rows || []);
  if (stash.shape === "shoppingPerson") {
    return shapeShoppingPerson(
      stash.personId,
      stash.listId,
      stash.gifts || [],
      stash.claims || [],
      stash.userId,
      stash.associateTag,
    );
  }
  if (stash.shape === "ideas") {
    return stash.ideaResult || { ideas: [], message: "Ideas are unavailable right now." };
  }
  if (stash.shape === "received") return stash.received || [];
  if (stash.result !== undefined) return stash.result;
  return null;
}
