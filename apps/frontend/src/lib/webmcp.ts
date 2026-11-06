"use client";

import * as api from "@/lib/api";

type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean };
  execute: (input: Record<string, unknown>) => Promise<unknown>;
};

type ModelContext = {
  registerTool?: (tool: Tool) => { unregister?: () => void } | void;
  unregisterTool?: (name: string) => void;
};

type Options = {
  signedIn: boolean;
  childSafe: boolean;
  shareToken: string | null;
};

const listeners = new Set<(value: boolean) => void>();
let childSafeValue = false;

export function setAgentChildSafe(value: boolean) {
  childSafeValue = value;
  for (const listener of listeners) listener(value);
}

export function subscribeChildSafe(listener: (value: boolean) => void) {
  listeners.add(listener);
  listener(childSafeValue);
  return () => {
    listeners.delete(listener);
  };
}

function context(): ModelContext | null {
  if (typeof document === "undefined") return null;
  const host = document as Document & { modelContext?: ModelContext };
  return host.modelContext ?? null;
}

function text(value: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(value) }] };
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return { isError: true, content: [{ type: "text", text: message }] };
}

async function run(work: () => Promise<unknown>) {
  try {
    return text(await work());
  } catch (error) {
    return failure(error);
  }
}

function str(input: Record<string, unknown>, key: string) {
  return input[key] == null ? undefined : String(input[key]);
}

function giftInput(input: Record<string, unknown>): api.GiftInput {
  return {
    kind: String(input.kind || "CUSTOM") as api.GiftKind,
    title: str(input, "title"),
    url: str(input, "url"),
    price: input.price == null ? null : Number(input.price),
    notes: str(input, "notes"),
    quantity: input.quantity == null ? undefined : Number(input.quantity),
    timingPhrase: (str(input, "timingPhrase") as api.TimingPhrase | undefined) ?? null,
    membershipPhrase: (str(input, "membershipPhrase") as api.MembershipPhrase | undefined) ?? null,
  };
}

const giftProps = {
  kind: { type: "string" },
  title: { type: "string" },
  url: { type: "string" },
  price: { type: "number" },
  notes: { type: "string" },
  quantity: { type: "number" },
  timingPhrase: { type: "string" },
  membershipPhrase: { type: "string" },
};

export function registerNicelistTools(signal: AbortSignal, options: Options) {
  const model = context();
  if (!model?.registerTool) return;
  const tools: Tool[] = [];

  if (!options.signedIn && options.shareToken) {
    const token = options.shareToken;
    tools.push({
      name: "nicelist_guest_list",
      description: "Read a public list. Names of shoppers are not included.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: () => run(() => api.fetchGuestList(token)),
    });
  }

  if (options.signedIn) {
    tools.push(
      {
        name: "nicelist_lists",
        description: "List the signed-in adult's lists and their children's lists. No claim details.",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true },
        execute: () => run(() => api.fetchMyLists()),
      },
      {
        name: "nicelist_read_list",
        description: "Read a list this adult manages. Their own list omits shopper names.",
        inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
        annotations: { readOnlyHint: true },
        execute: (input) => run(() => api.fetchMyList(String(input.id))),
      },
      {
        name: "nicelist_add_gift",
        description: "Add a product, custom gift, experience, or membership to a managed list. This does not reserve it.",
        inputSchema: { type: "object", properties: { listId: { type: "string" }, ...giftProps }, required: ["listId", "kind"] },
        execute: (input) => run(() => api.addGift(String(input.listId), giftInput(input))),
      },
      {
        name: "nicelist_edit_gift",
        description: "Edit a gift's title, link, notes, price, or quantity.",
        inputSchema: { type: "object", properties: { listId: { type: "string" }, id: { type: "string" }, ...giftProps }, required: ["listId", "id", "kind"] },
        execute: (input) => run(() => api.updateGift(String(input.listId), String(input.id), giftInput(input))),
      },
      {
        name: "nicelist_delete_gift",
        description: "Delete a gift from a managed list.",
        inputSchema: { type: "object", properties: { listId: { type: "string" }, id: { type: "string" } }, required: ["listId", "id"] },
        annotations: { destructiveHint: true },
        execute: (input) => run(() => api.deleteGift(String(input.listId), String(input.id))),
      },
      {
        name: "nicelist_delete_list",
        description: "Delete a list this adult manages.",
        inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
        annotations: { destructiveHint: true },
        execute: (input) => run(() => api.deleteList(String(input.id))),
      },
      {
        name: "nicelist_rename_list",
        description: "Rename a list this adult manages.",
        inputSchema: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } }, required: ["id", "name"] },
        execute: (input) => run(() => api.renameList(String(input.id), String(input.name))),
      },
      {
        name: "nicelist_visibility",
        description: "Set a list to PUBLIC, FRIENDS, or PRIVATE.",
        inputSchema: { type: "object", properties: { id: { type: "string" }, visibility: { type: "string" } }, required: ["id", "visibility"] },
        execute: (input) => run(() => api.setListVisibility(String(input.id), String(input.visibility) as api.Visibility)),
      },
      {
        name: "nicelist_share_link",
        description: "Copy the share link and who that link lets in.",
        inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
        annotations: { readOnlyHint: true },
        execute: (input) =>
          run(async () => {
            const list = await api.fetchMyList(String(input.id));
            if (!list) return { error: "This list wasn't found." };
            const origin = typeof location === "undefined" ? "" : location.origin;
            return { url: `${origin}/list?t=${list.shareToken}`, who: api.visibilityCopy[list.visibility] };
          }),
      },
      {
        name: "nicelist_add_child",
        description: "Add a child by name. This creates that child's list.",
        inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
        execute: (input) => run(() => api.addChild(String(input.name))),
      },
      {
        name: "nicelist_invite_comanager",
        description: "Invite another adult to manage a child's list.",
        inputSchema: { type: "object", properties: { childId: { type: "string" }, email: { type: "string" } }, required: ["childId", "email"] },
        execute: (input) => run(() => api.inviteCoManager(String(input.childId), String(input.email))),
      },
      {
        name: "nicelist_remove_comanager",
        description: "Remove a co-manager from a child's list.",
        inputSchema: { type: "object", properties: { childId: { type: "string" }, userId: { type: "string" } }, required: ["childId", "userId"] },
        annotations: { destructiveHint: true },
        execute: (input) => run(() => api.removeCoManager(String(input.childId), String(input.userId))),
      },
      {
        name: "nicelist_reveal",
        description: "Reveal a list. This ends the surprise.",
        inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
        annotations: { destructiveHint: true },
        execute: (input) => run(() => api.revealList(String(input.id))),
      },
      {
        name: "nicelist_friends",
        description: "List friends and pending requests by display name.",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true },
        execute: () => run(() => api.fetchFriends()),
      },
      {
        name: "nicelist_friend_request",
        description: "Send a friend request by email.",
        inputSchema: { type: "object", properties: { email: { type: "string" } }, required: ["email"] },
        execute: (input) => run(() => api.sendFriendRequest(String(input.email))),
      },
      {
        name: "nicelist_accept_friend",
        description: "Accept a friend request.",
        inputSchema: { type: "object", properties: { userId: { type: "string" } }, required: ["userId"] },
        execute: (input) => run(() => api.acceptFriendRequest(String(input.userId))),
      },
      {
        name: "nicelist_decline_friend",
        description: "Decline a friend request.",
        inputSchema: { type: "object", properties: { userId: { type: "string" } }, required: ["userId"] },
        execute: (input) => run(() => api.declineFriendRequest(String(input.userId))),
      },
      {
        name: "nicelist_cancel_friend",
        description: "Cancel a friend request you sent.",
        inputSchema: { type: "object", properties: { userId: { type: "string" } }, required: ["userId"] },
        execute: (input) => run(() => api.cancelFriendRequest(String(input.userId))),
      },
      {
        name: "nicelist_remove_friend",
        description: "End a friendship.",
        inputSchema: { type: "object", properties: { userId: { type: "string" } }, required: ["userId"] },
        annotations: { destructiveHint: true },
        execute: (input) => run(() => api.removeFriend(String(input.userId))),
      },
    );

    if (!options.childSafe) {
      tools.push(
        {
          name: "nicelist_ideas",
          description: "Ask for a few gift ideas in a price band. Nothing is saved.",
          inputSchema: { type: "object", properties: { listId: { type: "string" }, band: { type: "string" } }, required: ["listId", "band"] },
          annotations: { readOnlyHint: true },
          execute: (input) => run(() => api.askForIdeas(String(input.listId), input.band as api.PriceBand)),
        },
        {
          name: "nicelist_rate",
          description: "After reveal, rate a purchased gift from 1 to 5 stars.",
          inputSchema: { type: "object", properties: { listId: { type: "string" }, giftId: { type: "string" }, stars: { type: "number" } }, required: ["listId", "giftId", "stars"] },
          execute: (input) => run(() => api.rateGift(String(input.listId), String(input.giftId), Number(input.stars))),
        },
        {
          name: "nicelist_rate_suggestion",
          description: "Rate a purchased suggestion that was not on the list, from 1 to 5 stars.",
          inputSchema: { type: "object", properties: { id: { type: "string" }, stars: { type: "number" } }, required: ["id", "stars"] },
          execute: (input) => run(() => api.rateSuggestion(String(input.id), Number(input.stars))),
        },
        {
          name: "nicelist_shopping",
          description: "Read this shopper's Christmas shopping list.",
          inputSchema: { type: "object", properties: {} },
          annotations: { readOnlyHint: true },
          execute: () => run(() => api.fetchShoppingList()),
        },
        {
          name: "nicelist_add_person",
          description: "Add a person to the shopping list. Kind is FRIEND, CHILD, or NAME.",
          inputSchema: { type: "object", properties: { name: { type: "string" }, kind: { type: "string" }, refId: { type: "string" } }, required: ["name", "kind"] },
          execute: (input) => run(() => api.addShoppingPerson(String(input.name), String(input.kind) as api.PersonKind, str(input, "refId"))),
        },
        {
          name: "nicelist_remove_person",
          description: "Remove a person and their private planned gifts from the shopping list.",
          inputSchema: { type: "object", properties: { personId: { type: "string" } }, required: ["personId"] },
          annotations: { destructiveHint: true },
          execute: (input) => run(() => api.removeShoppingPerson(String(input.personId))),
        },
        {
          name: "nicelist_add_planned_gift",
          description: "Add a private planned gift. It never appears on the recipient's list.",
          inputSchema: { type: "object", properties: { personId: { type: "string" }, ...giftProps }, required: ["personId"] },
          execute: (input) => run(() => api.addPlannedGift(String(input.personId), giftInput(input))),
        },
        {
          name: "nicelist_edit_planned_gift",
          description: "Edit a private planned gift.",
          inputSchema: { type: "object", properties: { personId: { type: "string" }, id: { type: "string" }, title: { type: "string" }, url: { type: "string" }, price: { type: "number" }, notes: { type: "string" } }, required: ["personId", "id"] },
          execute: (input) =>
            run(() =>
              api.updatePlannedGift(String(input.personId), String(input.id), {
                title: str(input, "title"),
                url: str(input, "url"),
                price: input.price == null ? null : Number(input.price),
                notes: str(input, "notes"),
              }),
            ),
        },
        {
          name: "nicelist_delete_planned_gift",
          description: "Delete a private planned gift.",
          inputSchema: { type: "object", properties: { personId: { type: "string" }, id: { type: "string" } }, required: ["personId", "id"] },
          annotations: { destructiveHint: true },
          execute: (input) => run(() => api.deletePlannedGift(String(input.personId), String(input.id))),
        },
        {
          name: "nicelist_shopping_ideas",
          description: "Ask for a few gift ideas for a person on the shopping list. Nothing is saved.",
          inputSchema: { type: "object", properties: { personId: { type: "string" }, band: { type: "string" } }, required: ["personId", "band"] },
          annotations: { readOnlyHint: true },
          execute: (input) => run(() => api.askForShoppingIdeas(String(input.personId), input.band as api.PriceBand)),
        },
        {
          name: "nicelist_reserve",
          description: "Reserve a wishlist gift this shopper can already see. A taken quantity returns an error.",
          inputSchema: { type: "object", properties: { listId: { type: "string" }, giftId: { type: "string" }, note: { type: "string" } }, required: ["listId", "giftId"] },
          execute: (input) => run(() => api.reserveGift(String(input.listId), String(input.giftId), str(input, "note"))),
        },
        {
          name: "nicelist_set_purchased",
          description: "Mark this shopper's claim purchased or set it back to reserved. Optional note is the line other shoppers see.",
          inputSchema: { type: "object", properties: { listId: { type: "string" }, giftId: { type: "string" }, slot: { type: "number" }, purchased: { type: "boolean" }, note: { type: "string" } }, required: ["listId", "giftId", "slot", "purchased"] },
          execute: (input) =>
            run(() =>
              api.setPurchased(String(input.listId), String(input.giftId), Number(input.slot), Boolean(input.purchased), str(input, "note")),
            ),
        },
        {
          name: "nicelist_release",
          description: "Release this shopper's claim.",
          inputSchema: { type: "object", properties: { listId: { type: "string" }, giftId: { type: "string" }, slot: { type: "number" } }, required: ["listId", "giftId", "slot"] },
          execute: (input) => run(() => api.releaseGift(String(input.listId), String(input.giftId), Number(input.slot))),
        },
        {
          name: "nicelist_delete_shopping_list",
          description: "Delete the shopping list. Wishlist claims stay.",
          inputSchema: { type: "object", properties: {} },
          annotations: { destructiveHint: true },
          execute: () => run(() => api.deleteShoppingList()),
        },
      );
    }

    if (options.shareToken && !options.childSafe) {
      const token = options.shareToken;
      tools.push({
        name: "nicelist_shop_list",
        description: "Read the list this person is shopping, with who claimed each gift and how many are still open.",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true },
        execute: () => run(() => api.fetchShopList(token)),
      });
    }
  }

  const handles = tools.map((tool) => ({ name: tool.name, handle: model.registerTool?.(tool) }));
  const abort = () => {
    for (const item of handles) {
      item.handle?.unregister?.();
      model.unregisterTool?.(item.name);
    }
  };
  if (signal.aborted) abort();
  else signal.addEventListener("abort", abort, { once: true });
}
