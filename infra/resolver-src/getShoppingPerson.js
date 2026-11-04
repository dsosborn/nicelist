import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      shopperId: ctx.stash.userId,
      sk: "PERSON#" + ctx.args.personId,
    }),
  };
}

export function response(ctx) {
  if (!ctx.result) util.error("That person isn't on your shopping list.");
  ctx.stash.person = ctx.result;
  ctx.stash.personId = ctx.args.personId;
  ctx.stash.needsFriends = ctx.result.personKind === "FRIEND";
  return ctx.result;
}
