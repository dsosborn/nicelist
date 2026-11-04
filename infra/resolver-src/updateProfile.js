import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const parsed = validateDisplayName(ctx.args.displayName);
  if (parsed.error) util.error(parsed.error);
  ctx.stash.nextName = parsed.value;
  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({ userId: ctx.stash.userId }),
    update: {
      expression: "SET displayName = :displayName",
      expressionValues: util.dynamodb.toMapValues({ ":displayName": parsed.value }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const email = ctx.stash.profile ? ctx.stash.profile.email : normalizeEmail(ctx.stash.email);
  ctx.stash.result = {
    id: ctx.stash.userId,
    displayName: ctx.stash.nextName,
    email: email,
  };
  return ctx.stash.result;
}
