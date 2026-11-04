import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.stash.profile) {
    runtime.earlyReturn(ctx.stash.profile);
  }
  const email = normalizeEmail(ctx.stash.email);
  const displayName = displayNameFrom(ctx.stash.givenName, email);
  ctx.stash.createdProfile = {
    id: ctx.stash.userId,
    displayName: displayName,
    email: email,
  };
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ userId: ctx.stash.userId }),
    attributeValues: util.dynamodb.toMapValues({
      displayName: displayName,
      email: email,
      emailLower: email,
      createdAt: util.time.nowISO8601(),
    }),
    condition: {
      expression: "attribute_not_exists(userId)",
    },
  };
}

export function response(ctx) {
  if (ctx.stash.profile) {
    ctx.stash.result = {
      id: ctx.stash.profile.userId,
      displayName: ctx.stash.profile.displayName,
      email: ctx.stash.profile.email,
    };
    return ctx.stash.result;
  }
  ctx.stash.profile = ctx.stash.createdProfile;
  ctx.stash.result = ctx.stash.createdProfile;
  return ctx.stash.result;
}
