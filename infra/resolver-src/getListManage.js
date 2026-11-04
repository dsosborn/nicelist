import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const id = ctx.args.id || ctx.args.listId;
  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({ id: id }),
  };
}

export function response(ctx) {
  const list = ctx.result;
  const field = ctx.info.fieldName;
  if (!list || !canManage(list, ctx.stash.userId)) {
    ctx.stash.notFound = true;
    ctx.stash.list = null;
    if (field === "rateGift") util.error("This list wasn't found.");
    return null;
  }
  ctx.stash.list = list;
  ctx.stash.listId = list.id;
  ctx.stash.skipClaims = !ownerSeesClaims(list, ctx.stash.userId);
  if (
    field === "revealList" ||
    field === "deleteList" ||
    field === "deleteGift" ||
    field === "updateGift" ||
    field === "removeChild" ||
    field === "rateGift"
  ) {
    ctx.stash.skipClaims = false;
  }
  if (field === "rateGift") {
    if (!list.revealedAt) util.error("You can rate gifts after the list is revealed.");
    if (list.recipientId !== ctx.stash.userId && !list.isChild) {
      util.error("You can rate gifts on your own list.");
    }
  }
  return list;
}
