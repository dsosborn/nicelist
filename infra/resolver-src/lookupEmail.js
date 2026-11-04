import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const email = normalizeEmail(ctx.args.email);
  if (!email) util.error("Email is required.");
  ctx.stash.targetEmail = email;
  return {
    operation: "Query",
    index: "emailLower-index",
    query: {
      expression: "emailLower = :email",
      expressionValues: util.dynamodb.toMapValues({ ":email": email }),
    },
    limit: 1,
  };
}

export function response(ctx) {
  const items = itemsOf(ctx.result);
  if (!items.length) util.error("No account uses that email.");
  const person = items[0];
  if (person.userId === ctx.stash.userId) util.error("You can't add yourself.");
  ctx.stash.target = person;
  return person;
}
