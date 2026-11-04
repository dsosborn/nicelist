import { runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.ideaResult) runtime.earlyReturn(ctx.stash.ideaResult);
  return {
    operation: "Invoke",
    payload: ctx.stash.ideaRequest || { gifts: [], band: ctx.args.band },
  };
}

export function response(ctx) {
  if (ctx.error || !ctx.result) {
    ctx.stash.ideaResult = { ideas: [], message: "Ideas are unavailable right now." };
    return ctx.stash.ideaResult;
  }
  const ideas = ctx.result.ideas || [];
  ctx.stash.ideaResult = { ideas: ideas, message: ideas.length ? null : "Ideas are unavailable right now." };
  return ctx.stash.ideaResult;
}
