import { runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (!ctx.stash.mail) runtime.earlyReturn(null);
  return {
    operation: "Invoke",
    payload: ctx.stash.mail,
  };
}

export function response(ctx) {
  if (ctx.error) return ctx.stash.result === undefined ? null : ctx.stash.result;
  return ctx.stash.result === undefined ? null : ctx.stash.result;
}
