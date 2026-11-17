import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.notFound || !ctx.stash.list) runtime.earlyReturn(null);
  if (ctx.stash.list.revealedAt) util.error("This list is revealed.");
  const locked = seasonLockError(ctx.stash.list);
  if (locked) util.error(locked);
  const parsed = validateGiftInput(ctx.args);
  if (parsed.error) util.error(parsed.error);
  const id = util.autoId();
  const now = util.time.nowISO8601();
  const gift = parsed.value;
  gift.id = id;
  gift.listId = ctx.stash.list.id;
  gift.createdAt = now;
  gift.sk = now + "#" + id;
  if (ctx.stash.copiedImage) gift.imageUrl = ctx.stash.copiedImage;
  ctx.stash.gift = gift;
  const item = defined({
    id: id,
    listId: ctx.stash.list.id,
    sk: gift.sk,
    kind: gift.kind,
    title: gift.title,
    url: gift.url,
    imageUrl: gift.imageUrl,
    price: gift.price,
    goalCents: gift.goalCents,
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
