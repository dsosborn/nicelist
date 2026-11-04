import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.notFound || !ctx.stash.list) runtime.earlyReturn(null);
  ctx.stash.result = listSummary(ctx.stash.list);
  return {
    operation: "DeleteItem",
    key: util.dynamodb.toMapValues({ id: ctx.stash.list.id }),
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.stash.result;
}
