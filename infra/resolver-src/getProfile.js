import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({ userId: ctx.stash.userId }),
  };
}

export function response(ctx) {
  ctx.stash.profile = ctx.result || null;
  return ctx.result;
}
