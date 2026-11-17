import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const list = ctx.stash.list;
  if (!list || list.visibility === "PRIVATE" || list.revealedAt) runtime.earlyReturn(null);
  const day = util.time.nowISO8601().substring(0, 10);
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ dueDate: day, listId: list.id }),
    attributeValues: util.dynamodb.toMapValues({
      listName: list.name,
      shareToken: list.shareToken,
      visibility: list.visibility,
      ownerId: list.ownerId,
      recipientId: list.recipientId,
      managerIds: managerIdsOf(list),
    }),
  };
}

export function response(ctx) {
  return ctx.stash.result;
}
