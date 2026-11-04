import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.notFound || !ctx.stash.list) runtime.earlyReturn(null);
  const list = ctx.stash.list;
  const field = ctx.info.fieldName;
  let expression = "";
  let values = {};
  let names = null;
  if (field === "renameList") {
    const parsed = validateListName(ctx.args.name);
    if (parsed.error) util.error(parsed.error);
    expression = "SET #name = :name";
    values = { ":name": parsed.value };
    names = { "#name": "name" };
    list.name = parsed.value;
  } else if (field === "setListVisibility") {
    expression = "SET visibility = :visibility";
    values = { ":visibility": ctx.args.visibility };
    list.visibility = ctx.args.visibility;
  } else if (field === "rotateShareToken") {
    const token = util.autoId();
    expression = "SET shareToken = :shareToken";
    values = { ":shareToken": token };
    list.shareToken = token;
  } else if (field === "revealList") {
    if (list.revealedAt) util.error("This list is already revealed.");
    const now = util.time.nowISO8601();
    expression = "SET revealedAt = :revealedAt";
    values = { ":revealedAt": now };
    list.revealedAt = now;
    ctx.stash.skipClaims = false;
  } else {
    util.error("Unsupported update.");
  }
  const update = {
    expression: expression,
    expressionValues: util.dynamodb.toMapValues(values),
  };
  if (names) update.expressionNames = names;
  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({ id: list.id }),
    update: update,
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  ctx.stash.result = listSummary(ctx.stash.list);
  return ctx.stash.result;
}
