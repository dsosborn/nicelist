import { util, runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const field = ctx.info.fieldName;
  const list = ctx.stash.list;
  if (!list) runtime.earlyReturn(null);
  const managers = managerIdsOf(list).slice();
  if (field === "removeCoManager") {
    const next = managers.filter((managerId) => managerId !== ctx.args.userId);
    if (!next.length) next.push(list.ownerId);
    return {
      operation: "TransactWriteItems",
      transactItems: [
        {
          table: tbl("lists"),
          operation: "UpdateItem",
          key: util.dynamodb.toMapValues({ id: list.id }),
          update: {
            expression: "SET managerIds = :managerIds",
            expressionValues: util.dynamodb.toMapValues({ ":managerIds": next }),
          },
        },
        {
          table: tbl("relationships"),
          operation: "DeleteItem",
          key: util.dynamodb.toMapValues({
            userId: ctx.args.userId,
            sk: "COMANAGER#" + list.recipientId,
          }),
        },
        {
          table: tbl("relationships"),
          operation: "DeleteItem",
          key: util.dynamodb.toMapValues({
            userId: list.recipientId,
            sk: "MANAGED_BY#" + ctx.args.userId,
          }),
        },
      ],
    };
  }
  const person = ctx.stash.target;
  if (!person) util.error("No account uses that email.");
  if (!contains(managers, person.userId)) managers.push(person.userId);
  const now = util.time.nowISO8601();
  return {
    operation: "TransactWriteItems",
    transactItems: [
      {
        table: tbl("lists"),
        operation: "UpdateItem",
        key: util.dynamodb.toMapValues({ id: list.id }),
        update: {
          expression: "SET managerIds = :managerIds",
          expressionValues: util.dynamodb.toMapValues({ ":managerIds": managers }),
        },
      },
      {
        table: tbl("relationships"),
        operation: "PutItem",
        key: util.dynamodb.toMapValues({ userId: person.userId, sk: "COMANAGER#" + list.recipientId }),
        attributeValues: util.dynamodb.toMapValues({
          kind: "COMANAGER",
          otherId: list.recipientId,
          name: list.recipientName,
          listId: list.id,
          createdAt: now,
        }),
      },
      {
        table: tbl("relationships"),
        operation: "PutItem",
        key: util.dynamodb.toMapValues({ userId: list.recipientId, sk: "MANAGED_BY#" + person.userId }),
        attributeValues: util.dynamodb.toMapValues({
          kind: "MANAGED_BY",
          otherId: person.userId,
          name: person.displayName,
          createdAt: now,
        }),
      },
    ],
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  ctx.stash.result = true;
  return true;
}
