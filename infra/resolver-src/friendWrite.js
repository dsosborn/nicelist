import { util, runtime } from "@aws-appsync/utils";

function hasSk(rows, sk) {
  for (let i = 0; i < rows.length; i++) if (rows[i].sk === sk) return rows[i];
  return null;
}

export function request(ctx) {
  const field = ctx.info.fieldName;
  const rows = ctx.stash.rows || [];
  const me = ctx.stash.userId;
  const now = util.time.nowISO8601();
  if (field === "sendFriendRequest") {
    const other = ctx.stash.target.userId;
    if (hasSk(rows, "FRIEND#" + other) || hasSk(rows, "FRIEND_OUT#" + other) || hasSk(rows, "FRIEND_IN#" + other)) {
      util.error("That request already exists.");
    }
    const myName = profileName(ctx);
    const theirName = ctx.stash.target.displayName || "Someone";
    return {
      operation: "TransactWriteItems",
      transactItems: [
        {
          table: tbl("relationships"),
          operation: "PutItem",
          key: util.dynamodb.toMapValues({ userId: me, sk: "FRIEND_OUT#" + other }),
          attributeValues: util.dynamodb.toMapValues({
            kind: "FRIEND_OUT",
            otherId: other,
            name: theirName,
            createdAt: now,
          }),
        },
        {
          table: tbl("relationships"),
          operation: "PutItem",
          key: util.dynamodb.toMapValues({ userId: other, sk: "FRIEND_IN#" + me }),
          attributeValues: util.dynamodb.toMapValues({
            kind: "FRIEND_IN",
            otherId: me,
            name: myName,
            createdAt: now,
          }),
        },
      ],
    };
  }
  const other = ctx.args.userId;
  if (field === "acceptFriendRequest") {
    if (!hasSk(rows, "FRIEND_IN#" + other)) util.error("That request isn't waiting.");
    const incoming = hasSk(rows, "FRIEND_IN#" + other);
    const myName = profileName(ctx);
    return {
      operation: "TransactWriteItems",
      transactItems: [
        {
          table: tbl("relationships"),
          operation: "DeleteItem",
          key: util.dynamodb.toMapValues({ userId: me, sk: "FRIEND_IN#" + other }),
        },
        {
          table: tbl("relationships"),
          operation: "DeleteItem",
          key: util.dynamodb.toMapValues({ userId: other, sk: "FRIEND_OUT#" + me }),
        },
        {
          table: tbl("relationships"),
          operation: "PutItem",
          key: util.dynamodb.toMapValues({ userId: me, sk: "FRIEND#" + other }),
          attributeValues: util.dynamodb.toMapValues({
            kind: "FRIEND",
            otherId: other,
            name: incoming.name || "Someone",
            createdAt: now,
          }),
        },
        {
          table: tbl("relationships"),
          operation: "PutItem",
          key: util.dynamodb.toMapValues({ userId: other, sk: "FRIEND#" + me }),
          attributeValues: util.dynamodb.toMapValues({
            kind: "FRIEND",
            otherId: me,
            name: myName,
            createdAt: now,
          }),
        },
      ],
    };
  }
  if (field === "declineFriendRequest") {
    if (!hasSk(rows, "FRIEND_IN#" + other)) runtime.earlyReturn({ ok: true });
    return {
      operation: "TransactWriteItems",
      transactItems: [
        {
          table: tbl("relationships"),
          operation: "DeleteItem",
          key: util.dynamodb.toMapValues({ userId: me, sk: "FRIEND_IN#" + other }),
        },
        {
          table: tbl("relationships"),
          operation: "DeleteItem",
          key: util.dynamodb.toMapValues({ userId: other, sk: "FRIEND_OUT#" + me }),
        },
      ],
    };
  }
  if (field === "cancelFriendRequest") {
    if (!hasSk(rows, "FRIEND_OUT#" + other)) runtime.earlyReturn({ ok: true });
    return {
      operation: "TransactWriteItems",
      transactItems: [
        {
          table: tbl("relationships"),
          operation: "DeleteItem",
          key: util.dynamodb.toMapValues({ userId: me, sk: "FRIEND_OUT#" + other }),
        },
        {
          table: tbl("relationships"),
          operation: "DeleteItem",
          key: util.dynamodb.toMapValues({ userId: other, sk: "FRIEND_IN#" + me }),
        },
      ],
    };
  }
  if (!hasSk(rows, "FRIEND#" + other)) runtime.earlyReturn({ ok: true });
  return {
    operation: "TransactWriteItems",
    transactItems: [
      {
        table: tbl("relationships"),
        operation: "DeleteItem",
        key: util.dynamodb.toMapValues({ userId: me, sk: "FRIEND#" + other }),
      },
      {
        table: tbl("relationships"),
        operation: "DeleteItem",
        key: util.dynamodb.toMapValues({ userId: other, sk: "FRIEND#" + me }),
      },
    ],
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return { ok: true };
}
