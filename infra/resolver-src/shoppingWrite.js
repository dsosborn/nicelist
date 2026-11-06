import { util, runtime } from "@aws-appsync/utils";

function person(rows, personId) {
  return rows.find((row) => row.sk === "PERSON#" + personId) || null;
}

export function request(ctx) {
  const field = ctx.info.fieldName;
  const me = ctx.stash.userId;
  const rows = ctx.stash.rows || [];
  if (field === "renameShoppingList") {
    const parsed = validateListName(ctx.args.name);
    if (parsed.error) util.error(parsed.error);
    return {
      operation: "UpdateItem",
      key: util.dynamodb.toMapValues({ shopperId: me, sk: "LIST" }),
      update: {
        expression: "SET #name = :name",
        expressionNames: { "#name": "name" },
        expressionValues: util.dynamodb.toMapValues({ ":name": parsed.value }),
      },
    };
  }
  if (field === "addShoppingPerson") {
    const parsed = validateDisplayName(ctx.args.name);
    if (parsed.error) util.error(parsed.error);
    if ((ctx.args.kind === "FRIEND" || ctx.args.kind === "CHILD") && !ctx.args.refId) {
      util.error("Choose a person from your list.");
    }
    const id = util.autoId();
    ctx.stash.savedPerson = {
      id: id,
      name: parsed.value,
      kind: ctx.args.kind,
      refId: ctx.args.refId || null,
      standingNote: null,
    };
    const item = defined({
      personId: id,
      name: parsed.value,
      personKind: ctx.args.kind,
      refId: ctx.args.refId,
    });
    return {
      operation: "PutItem",
      key: util.dynamodb.toMapValues({ shopperId: me, sk: "PERSON#" + id }),
      attributeValues: util.dynamodb.toMapValues(item),
    };
  }
  if (field === "setStandingNote") {
    if (!person(rows, ctx.args.personId)) util.error("That person isn't on your shopping list.");
    const note = clean(ctx.args.note);
    if (note.length > LIMITS.standingNote) util.error("That note is too long.");
    return {
      operation: "UpdateItem",
      key: util.dynamodb.toMapValues({ shopperId: me, sk: "PERSON#" + ctx.args.personId }),
      update: {
        expression: "SET standingNote = :note",
        expressionValues: util.dynamodb.toMapValues({ ":note": note }),
      },
    };
  }
  if (field === "addPlannedGift" || field === "updatePlannedGift") {
    if (!person(rows, ctx.args.personId)) util.error("That person isn't on your shopping list.");
    const parsed = validateGiftInput(ctx.args);
    if (parsed.error) util.error(parsed.error);
    const id = field === "updatePlannedGift" ? ctx.args.id : util.autoId();
    ctx.stash.savedPlan = {
      id: id,
      personId: ctx.args.personId,
      kind: parsed.value.kind,
      title: parsed.value.title,
      url: parsed.value.url,
      price: parsed.value.price,
      notes: parsed.value.notes,
      timingPhrase: parsed.value.timingPhrase,
      membershipPhrase: parsed.value.membershipPhrase,
      purchased: false,
      againNextYear: false,
    };
    const item = defined({
      giftId: id,
      personId: ctx.args.personId,
      kind: parsed.value.kind,
      title: parsed.value.title,
      url: parsed.value.url,
      price: parsed.value.price,
      notes: parsed.value.notes,
      timingPhrase: parsed.value.timingPhrase,
      membershipPhrase: parsed.value.membershipPhrase,
      purchased: false,
      againNextYear: false,
    });
    return {
      operation: "PutItem",
      key: util.dynamodb.toMapValues({ shopperId: me, sk: "PLAN#" + ctx.args.personId + "#" + id }),
      attributeValues: util.dynamodb.toMapValues(item),
    };
  }
  if (field === "setPlannedPurchased") {
    return {
      operation: "UpdateItem",
      key: util.dynamodb.toMapValues({
        shopperId: me,
        sk: "PLAN#" + ctx.args.personId + "#" + ctx.args.id,
      }),
      update: {
        expression: "SET purchased = :purchased",
        expressionValues: util.dynamodb.toMapValues({ ":purchased": ctx.args.purchased }),
      },
    };
  }
  if (field === "setAgainNextYear") {
    return {
      operation: "UpdateItem",
      key: util.dynamodb.toMapValues({
        shopperId: me,
        sk: "AGAIN#" + ctx.args.claimId,
      }),
      update: {
        expression: "SET personId = :personId, #on = :on",
        expressionNames: { "#on": "on" },
        expressionValues: util.dynamodb.toMapValues({
          ":personId": ctx.args.personId,
          ":on": ctx.args.again,
        }),
      },
    };
  }
  if (field === "deletePlannedGift") {
    return {
      operation: "DeleteItem",
      key: util.dynamodb.toMapValues({
        shopperId: me,
        sk: "PLAN#" + ctx.args.personId + "#" + ctx.args.id,
      }),
    };
  }
  runtime.earlyReturn(null);
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const field = ctx.info.fieldName;
  if (field === "addShoppingPerson" || field === "setStandingNote") {
    const saved = ctx.stash.savedPerson;
    if (field === "setStandingNote") {
      const existing = person(ctx.stash.rows || [], ctx.args.personId);
      ctx.stash.result = {
        id: ctx.args.personId,
        name: existing ? existing.name : "",
        kind: existing ? existing.personKind : "NAME",
        refId: existing ? existing.refId : null,
        standingNote: clean(ctx.args.note),
      };
      return ctx.stash.result;
    }
    ctx.stash.result = saved;
    return saved;
  }
  if (field === "addPlannedGift" || field === "updatePlannedGift" || field === "setPlannedPurchased") {
    const plan = ctx.stash.savedPlan;
    if (field === "setPlannedPurchased" && plan) plan.purchased = ctx.args.purchased;
    if (!plan && field === "setPlannedPurchased") {
      ctx.stash.result = {
        id: ctx.args.id,
        personId: ctx.args.personId,
        kind: "CUSTOM",
        title: null,
        url: null,
        price: null,
        notes: null,
        timingPhrase: null,
        membershipPhrase: null,
        purchased: ctx.args.purchased,
        againNextYear: false,
      };
      return ctx.stash.result;
    }
    ctx.stash.result = plan;
    return plan;
  }
  if (field === "deletePlannedGift") {
    ctx.stash.result = {
      id: ctx.args.id,
      personId: ctx.args.personId,
      kind: "CUSTOM",
      title: null,
      url: null,
      price: null,
      notes: null,
      timingPhrase: null,
      membershipPhrase: null,
      purchased: false,
      againNextYear: false,
    };
    return ctx.stash.result;
  }
  if (field === "setAgainNextYear") {
    ctx.stash.result = ctx.args.again;
    return ctx.args.again;
  }
  return ctx.stash.rows;
}
