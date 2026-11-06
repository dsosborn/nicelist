import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const list = ctx.stash.list;
  if (!list || ctx.stash.notFound) util.error("This list wasn't found.");
  const field = ctx.info.fieldName;
  if (field === "dismissPoke") {
    if (!canManage(list, ctx.stash.userId)) util.error("This list wasn't found.");
    ctx.stash.result = true;
    return {
      operation: "DeleteItem",
      key: util.dynamodb.toMapValues({
        listId: list.id,
        sk: ctx.args.id,
      }),
    };
  }
  const band = ctx.args.band;
  const gifts = ctx.stash.gifts || [];
  const friendIds = ctx.stash.friendIds || [];
  if (!canPoke(list, gifts, ctx.stash.userId, friendIds, band)) {
    util.error("You can't poke this list for that price band.");
  }
  const choice = pickPoke(ctx.stash.pokes || [], ctx.stash.userId, band);
  if (choice.action === "existing") {
    ctx.stash.result = {
      id: choice.poke.sk || pokeKey(ctx.stash.userId, band),
      senderName: profileName(ctx),
      band: band,
      createdAt: choice.poke.createdAt || null,
    };
    runtime.earlyReturn(ctx.stash.result);
  }
  const now = util.time.nowISO8601();
  const sk = pokeKey(ctx.stash.userId, band);
  ctx.stash.result = {
    id: sk,
    senderName: profileName(ctx),
    band: band,
    createdAt: now,
  };
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ listId: list.id, sk: sk }),
    attributeValues: util.dynamodb.toMapValues({
      id: sk,
      senderId: ctx.stash.userId,
      senderName: profileName(ctx),
      ownerId: list.ownerId,
      managerIds: managerIdsOf(list),
      band: band,
      createdAt: now,
    }),
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.stash.result;
}
