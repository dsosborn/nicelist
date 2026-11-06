import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.notFound || !ctx.stash.list) runtime.earlyReturn(null);
  ctx.stash.result = listSummary(ctx.stash.list);
  const pokes = (ctx.stash.pokes || []).slice(0, 24);
  if (!pokes.length) {
    return {
      operation: "DeleteItem",
      key: util.dynamodb.toMapValues({ id: ctx.stash.list.id }),
    };
  }
  const items = pokes.map((row) => ({
    table: tbl("pokes"),
    operation: "DeleteItem",
    key: util.dynamodb.toMapValues({ listId: ctx.stash.list.id, sk: row.sk }),
  }));
  items.push({
    table: tbl("lists"),
    operation: "DeleteItem",
    key: util.dynamodb.toMapValues({ id: ctx.stash.list.id }),
  });
  return {
    operation: "TransactWriteItems",
    transactItems: items,
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.stash.result;
}
