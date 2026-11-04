import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.notFound || !ctx.stash.list) runtime.earlyReturn(null);
  const current = findGift(ctx.stash.gifts, ctx.args.id);
  if (!current) util.error("This gift wasn't found.");
  ctx.stash.currentGift = current;
  ctx.stash.result = ownerGiftView(current, [], false);
  return {
    operation: "DeleteItem",
    key: util.dynamodb.toMapValues({ listId: ctx.stash.list.id, sk: current.sk }),
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.stash.result;
}
