import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const parsed = validateListName(ctx.args.name);
  if (parsed.error) util.error(parsed.error);
  const id = util.autoId();
  const now = util.time.nowISO8601();
  const recipientName = profileName(ctx);
  const item = {
    id: id,
    ownerId: ctx.stash.userId,
    recipientId: ctx.stash.userId,
    recipientName: recipientName,
    isChild: false,
    name: parsed.value,
    visibility: "PUBLIC",
    shareToken: util.autoId(),
    createdAt: now,
    managerIds: [ctx.stash.userId],
  };
  ctx.stash.created = item;
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ id: id }),
    attributeValues: util.dynamodb.toMapValues({
      ownerId: item.ownerId,
      recipientId: item.recipientId,
      recipientName: item.recipientName,
      isChild: false,
      name: item.name,
      visibility: item.visibility,
      shareToken: item.shareToken,
      createdAt: item.createdAt,
      managerIds: item.managerIds,
    }),
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  ctx.stash.result = listSummary(ctx.stash.created);
  return ctx.stash.result;
}
