import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const profile = ctx.stash.profile || {};
  const today = util.time.nowISO8601().substring(0, 10);
  const count = profile.ideaDay === today ? profile.ideaCount || 0 : 0;
  if (count >= LIMITS.ideaCap) {
    ctx.stash.ideaResult = { ideas: [], message: "You've reached today's idea limit." };
    runtime.earlyReturn(profile);
  }
  const extra = {};
  if (ctx.stash.person) {
    extra.displayName = ctx.stash.person.name;
    extra.standingNote = ctx.stash.person.standingNote;
  }
  ctx.stash.ideaRequest = ideaContext(ctx.stash.gifts || [], ctx.args.band, extra);
  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({ userId: ctx.stash.userId }),
    update: {
      expression: "SET ideaDay = :day, ideaCount = :count",
      expressionValues: util.dynamodb.toMapValues({ ":day": today, ":count": count + 1 }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.result;
}
