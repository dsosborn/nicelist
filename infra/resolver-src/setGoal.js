import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.notFound || !ctx.stash.list) runtime.earlyReturn(null);
  if (ctx.stash.list.revealedAt) util.error("This list is revealed.");
  const locked = seasonLockError(ctx.stash.list);
  if (locked) util.error(locked);
  const current = findGift(ctx.stash.gifts, ctx.args.id);
  if (!current) util.error("This gift wasn't found.");
  if (current.kind !== "CUSTOM") util.error("Only a custom gift can collect money.");
  const goal = ctx.args.goalCents;
  if (goal !== null && goal !== undefined) {
    if (typeof goal !== "number" || goal < 1 || goal > LIMITS.priceMax) util.error("Goal amount is invalid.");
  }
  ctx.stash.currentGift = current;
  ctx.stash.goalCents = goal === undefined ? null : goal;
  if (goal === null || goal === undefined) {
    return {
      operation: "UpdateItem",
      key: util.dynamodb.toMapValues({ listId: ctx.stash.list.id, sk: current.sk }),
      update: { expression: "REMOVE goalCents" },
    };
  }
  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({ listId: ctx.stash.list.id, sk: current.sk }),
    update: {
      expression: "SET goalCents = :goal",
      expressionValues: util.dynamodb.toMapValues({ ":goal": goal }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const gift = ctx.stash.currentGift;
  gift.goalCents = ctx.stash.goalCents;
  gift.listId = ctx.stash.list.id;
  ctx.stash.result = ownerGiftView(gift, [], false);
  return ctx.stash.result;
}
