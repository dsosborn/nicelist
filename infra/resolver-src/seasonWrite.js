import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const current = activeYearOf(ctx.stash.profile);
  const next = current + 1;
  ctx.stash.activeYear = next;
  const now = util.time.nowISO8601();
  const listId = util.autoId();
  const name = "Christmas " + next;
  const lists = ctx.stash.myLists || [];
  const closes = lists
    .filter((list) => listYear(list) < next && !list.readOnly)
    .slice(0, 20)
    .map((list) => ({
      table: tbl("lists"),
      operation: "UpdateItem",
      key: util.dynamodb.toMapValues({ id: list.id }),
      update: {
        expression: "SET readOnly = :readOnly",
        expressionValues: util.dynamodb.toMapValues({ ":readOnly": true }),
      },
    }));
  ctx.stash.createdSeason = { year: next, name: name, listId: listId };
  return {
    operation: "TransactWriteItems",
    transactItems: [
      {
        table: tbl("profiles"),
        operation: "UpdateItem",
        key: util.dynamodb.toMapValues({ userId: ctx.stash.userId }),
        update: {
          expression: "SET seasonYear = :year",
          expressionValues: util.dynamodb.toMapValues({ ":year": next }),
        },
      },
      {
        table: tbl("lists"),
        operation: "PutItem",
        key: util.dynamodb.toMapValues({ id: listId }),
        attributeValues: util.dynamodb.toMapValues({
          ownerId: ctx.stash.userId,
          recipientId: ctx.stash.userId,
          recipientName: profileName(ctx),
          isChild: false,
          name: name,
          visibility: "PUBLIC",
          shareToken: util.autoId(),
          createdAt: now,
          managerIds: [ctx.stash.userId],
          year: next,
          readOnly: false,
        }),
      },
      {
        table: tbl("shopping"),
        operation: "PutItem",
        key: util.dynamodb.toMapValues({
          shopperId: ctx.stash.userId,
          sk: shoppingListKey(next),
        }),
        attributeValues: util.dynamodb.toMapValues({ name: name, year: next }),
      },
    ].concat(closes),
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const rows = (ctx.stash.rows || []).filter((row) => row.sk.indexOf("PERSON#") === 0);
  const created = ctx.stash.createdSeason;
  rows.push({ sk: shoppingListKey(created.year), name: created.name, year: created.year });
  ctx.stash.rows = rows;
  ctx.stash.activeYear = created.year;
  return rows;
}
