import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  if (ctx.info.fieldName !== "setPlannedPurchased" || !ctx.args.purchased) runtime.earlyReturn(null);
  const rows = ctx.stash.rows || [];
  const plan = rows.find((row) => row.sk === "PLAN#" + ctx.args.personId + "#" + ctx.args.id) || null;
  const person = rows.find((row) => row.sk === "PERSON#" + ctx.args.personId) || null;
  if (!plan || !person || !person.refId) runtime.earlyReturn(null);
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      recipientId: person.refId,
      sk: "INBOX#" + ctx.args.id,
    }),
    attributeValues: util.dynamodb.toMapValues(
      defined({
        title: plan.title || "A gift",
        price: plan.price,
        kind: plan.kind,
      }),
    ),
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.result;
}
