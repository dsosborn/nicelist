import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.notFound || !ctx.stash.list) runtime.earlyReturn(null);
  if (ctx.stash.list.revealedAt) util.error("This list is revealed.");
  const parsed = validateGiftInput(ctx.args);
  if (parsed.error) util.error(parsed.error);
  const id = util.autoId();
  const now = util.time.nowISO8601();
  const gift = parsed.value;
  gift.id = id;
  gift.createdAt = now;
  gift.sk = now + "#" + id;
  ctx.stash.gift = gift;
  const item = defined({
    id: id,
    sk: gift.sk,
    kind: gift.kind,
    title: gift.title,
    url: gift.url,
    price: gift.price,
    notes: gift.notes,
    quantity: gift.quantity,
    timingPhrase: gift.timingPhrase,
    membershipPhrase: gift.membershipPhrase,
    createdAt: now,
  });
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ listId: ctx.stash.list.id, sk: gift.sk }),
    attributeValues: util.dynamodb.toMapValues(item),
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.stash.gift;
}
