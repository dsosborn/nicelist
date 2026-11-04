import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const parsed = validateDisplayName(ctx.args.name);
  if (parsed.error) util.error(parsed.error);
  const childId = util.autoId();
  const listId = util.autoId();
  const now = util.time.nowISO8601();
  const list = {
    id: listId,
    ownerId: ctx.stash.userId,
    recipientId: childId,
    recipientName: parsed.value,
    isChild: true,
    name: parsed.value,
    visibility: "PUBLIC",
    shareToken: util.autoId(),
    createdAt: now,
    managerIds: [ctx.stash.userId],
  };
  ctx.stash.result = listSummary(list);
  return {
    operation: "TransactWriteItems",
    transactItems: [
      {
        table: tbl("relationships"),
        operation: "PutItem",
        key: util.dynamodb.toMapValues({ userId: ctx.stash.userId, sk: "CHILD#" + childId }),
        attributeValues: util.dynamodb.toMapValues({
          kind: "CHILD",
          otherId: childId,
          name: parsed.value,
          listId: listId,
          createdAt: now,
        }),
      },
      {
        table: tbl("relationships"),
        operation: "PutItem",
        key: util.dynamodb.toMapValues({ userId: childId, sk: "MANAGED_BY#" + ctx.stash.userId }),
        attributeValues: util.dynamodb.toMapValues({
          kind: "MANAGED_BY",
          otherId: ctx.stash.userId,
          name: profileName(ctx),
          createdAt: now,
        }),
      },
      {
        table: tbl("lists"),
        operation: "PutItem",
        key: util.dynamodb.toMapValues({ id: listId }),
        attributeValues: util.dynamodb.toMapValues({
          ownerId: list.ownerId,
          recipientId: list.recipientId,
          recipientName: list.recipientName,
          isChild: true,
          name: list.name,
          visibility: list.visibility,
          shareToken: list.shareToken,
          createdAt: list.createdAt,
          managerIds: list.managerIds,
        }),
      },
    ],
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.stash.result;
}
