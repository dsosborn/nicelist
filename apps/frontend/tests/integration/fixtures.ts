import type { Page } from "@playwright/test";
import {
  canManage,
  canPoke,
  claimQuantityChange,
  claimSlots,
  friendIdsOf,
  listSummary,
  openListError,
  pickPoke,
  pickReserve,
  ratingDelta,
  shapeFriends,
  shapeGuestList,
  shapeMyList,
  shapeReceived,
  shapeShopperList,
  shapeShopping,
  shapeShoppingPerson,
  shopperGiftView,
  slotKey,
  validateDisplayName,
  validateGiftInput,
  validateListName,
  validateShopperNote,
  ownerGiftView,
} from "../../../../infra/domain/rules.mjs";

type UserRecord = {
  sub: string;
  email: string;
  password: string;
  confirmed: boolean;
  displayName: string;
};

function makeJwt(sub: string, email: string, name: string, tokenUse: "id" | "access" = "id") {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub,
      username: sub,
      email,
      name,
      "cognito:username": sub,
      iss: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_fixture",
      token_use: tokenUse,
      client_id: "fixtureclientid123456",
      aud: "fixtureclientid123456",
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");
  return `${header}.${payload}.sig`;
}

function decodeSub(authHeader: string | undefined): { sub: string; email: string; name: string } | null {
  if (!authHeader) return null;
  const raw = authHeader.replace(/^Bearer\s+/i, "").trim();
  const parts = raw.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return { sub: payload.sub, email: payload.email || "", name: payload.name || "" };
  } catch {
    return null;
  }
}

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export class TrialFixtureWorld {
  users = new Map<string, UserRecord>();
  profiles: Record<string, string> = {};
  lists: Row[] = [];
  gifts: Record<string, Row[]> = {};
  claims: Record<string, Row[]> = {};
  pokes: Record<string, Row[]> = {};
  rels: Record<string, Row[]> = {};
  shopping: Record<string, Row[]> = {};
  ratings: Record<string, Row[]> = {};
  storeVisits: string[] = [];
  gtmUrls: string[] = [];
  associateTag = "nicelist-20";
  seq = 1;

  nextId(prefix: string) {
    this.seq += 1;
    return `${prefix}-${this.seq}`;
  }

  seedUser(email: string, password: string, displayName: string, sub = this.nextId("u")): UserRecord {
    const lower = email.toLowerCase();
    const record: UserRecord = { sub, email: lower, password, confirmed: true, displayName };
    this.users.set(lower, record);
    this.profiles[sub] = displayName;
    if (!this.lists.some((l) => l.ownerId === sub && !l.isChild)) {
      const listId = this.nextId("list");
      this.lists.push({
        id: listId,
        ownerId: sub,
        recipientId: sub,
        recipientName: displayName,
        isChild: false,
        name: `${displayName}'s list`,
        visibility: "PUBLIC",
        shareToken: `tok-${sub}`,
        createdAt: "2026-11-01T00:00:00.000Z",
        managerIds: [sub],
      });
    }
    return record;
  }

  makeFriends(subA: string, subB: string) {
    const nameA = this.profiles[subA] || "Friend A";
    const nameB = this.profiles[subB] || "Friend B";
    this.rels[subA] = (this.rels[subA] || []).concat([{ sk: `FRIEND#${subB}`, otherId: subB, name: nameB }]);
    this.rels[subB] = (this.rels[subB] || []).concat([{ sk: `FRIEND#${subA}`, otherId: subA, name: nameA }]);
  }

  async attach(page: Page) {
    await page.addInitScript(() => {
      (window as Window & { __nicelistTestAuth?: boolean }).__nicelistTestAuth = true;
    });

    await page.route("https://www.googletagmanager.com/**", async (route) => {
      this.gtmUrls.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "window.__gtmFixtureLoaded = true;",
      });
    });

    await page.route("https://store.example/**", async (route) => {
      this.storeVisits.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><title>Fixture Store</title><h1>Fixture Store Product</h1>",
      });
    });

    await page.route("https://www.amazon.com/**", async (route) => {
      this.storeVisits.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><title>Amazon Fixture</title><h1>Amazon Product</h1>",
      });
    });

    await page.route("https://cognito-idp.us-east-1.amazonaws.com/**", async (route) => {
      const target = route.request().headers()["x-amz-target"] || "";
      const body = JSON.parse(route.request().postData() || "{}");
      const op = target.split(".").pop();

      if (op === "SignUp") {
        const email = String(body.Username || "").toLowerCase();
        const sub = this.nextId("u");
        const local = email.split("@")[0] || "Someone";
        this.users.set(email, {
          sub,
          email,
          password: String(body.Password || ""),
          confirmed: false,
          displayName: local,
        });
        this.profiles[sub] = local;
        await route.fulfill({
          status: 200,
          contentType: "application/x-amz-json-1.1",
          body: JSON.stringify({
            UserConfirmed: false,
            UserSub: sub,
            CodeDeliveryDetails: {
              AttributeName: "email",
              DeliveryMedium: "EMAIL",
              Destination: email,
            },
          }),
        });
        return;
      }

      if (op === "ConfirmSignUp" || op === "ResendConfirmationCode" || op === "ForgotPassword" || op === "ConfirmForgotPassword") {
        const email = String(body.Username || "").toLowerCase();
        const user = this.users.get(email);
        if (user) {
          user.confirmed = true;
          if (op === "ConfirmForgotPassword" && body.Password) {
            user.password = String(body.Password);
          }
        }
        await route.fulfill({
          status: 200,
          contentType: "application/x-amz-json-1.1",
          body: JSON.stringify({}),
        });
        return;
      }

      if (op === "InitiateAuth") {
        const email = String(body.AuthParameters?.USERNAME || "").toLowerCase();
        const user = this.users.get(email) || Array.from(this.users.values()).find((u) => u.sub === email);
        if (!user) {
          await route.fulfill({
            status: 400,
            contentType: "application/x-amz-json-1.1",
            body: JSON.stringify({ __type: "UserNotFoundException", message: "Account not found." }),
          });
          return;
        }
        if (!user.confirmed) {
          await route.fulfill({
            status: 400,
            contentType: "application/x-amz-json-1.1",
            body: JSON.stringify({ __type: "UserNotConfirmedException", message: "User is not confirmed." }),
          });
          return;
        }
        if (body.AuthFlow === "USER_SRP_AUTH") {
          await route.fulfill({
            status: 200,
            contentType: "application/x-amz-json-1.1",
            body: JSON.stringify({
              ChallengeName: "PASSWORD_VERIFIER",
              ChallengeParameters: {
                SALT: "31323334353637383930313233343536",
                SECRET_BLOCK: Buffer.from("fixture-secret-block").toString("base64"),
                SRP_B: "02".repeat(128),
                USERNAME: user.sub,
                USER_ID_FOR_SRP: user.sub,
              },
            }),
          });
          return;
        }
        const idJwt = makeJwt(user.sub, user.email, user.displayName, "id");
        const accessJwt = makeJwt(user.sub, user.email, user.displayName, "access");
        await route.fulfill({
          status: 200,
          contentType: "application/x-amz-json-1.1",
          body: JSON.stringify({
            AuthenticationResult: {
              AccessToken: accessJwt,
              IdToken: idJwt,
              RefreshToken: `rt-${user.sub}`,
              ExpiresIn: 3600,
              TokenType: "Bearer",
            },
          }),
        });
        return;
      }

      if (op === "RespondToAuthChallenge") {
        const sub = String(body.ChallengeResponses?.USERNAME || "");
        const user = Array.from(this.users.values()).find((u) => u.sub === sub || u.email === sub.toLowerCase());
        const chosen = user || Array.from(this.users.values())[0];
        const idJwt = makeJwt(chosen.sub, chosen.email, chosen.displayName, "id");
        const accessJwt = makeJwt(chosen.sub, chosen.email, chosen.displayName, "access");
        await route.fulfill({
          status: 200,
          contentType: "application/x-amz-json-1.1",
          body: JSON.stringify({
            AuthenticationResult: {
              AccessToken: accessJwt,
              IdToken: idJwt,
              RefreshToken: `rt-${chosen.sub}`,
              ExpiresIn: 3600,
              TokenType: "Bearer",
            },
          }),
        });
        return;
      }

      if (op === "GetUser") {
        const decoded = decodeSub(body.AccessToken);
        const sub = decoded?.sub || "u-1";
        const email = decoded?.email || "ada@example.com";
        const name = this.profiles[sub] || decoded?.name || "Ada";
        await route.fulfill({
          status: 200,
          contentType: "application/x-amz-json-1.1",
          body: JSON.stringify({
            Username: sub,
            UserAttributes: [
              { Name: "sub", Value: sub },
              { Name: "email", Value: email },
              { Name: "name", Value: name },
            ],
          }),
        });
        return;
      }

      if (op === "RevokeToken" || op === "GlobalSignOut") {
        await route.fulfill({
          status: 200,
          contentType: "application/x-amz-json-1.1",
          body: JSON.stringify({}),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/x-amz-json-1.1",
        body: JSON.stringify({}),
      });
    });

    await page.route("https://*.appsync-api.us-east-1.amazonaws.com/graphql", async (route) => {
      const req = route.request();
      const body = JSON.parse(req.postData() || "{}");
      const query: string = body.query || "";
      const vars: Row = body.variables || {};
      const caller = decodeSub(req.headers()["authorization"]);
      const userId = caller?.sub || null;
      if (userId && caller?.email && !this.profiles[userId]) {
        this.profiles[userId] = caller.name || caller.email.split("@")[0];
      }

      const reply = (data: Record<string, unknown>) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data }),
        });
      const fail = (message: string) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: null, errors: [{ message }] }),
        });

      const fieldMatch = /(?:(?:query|mutation)\s*(?:\([^)]*\))?\s*|^)\{\s*(\w+)/.exec(query.trim());
      const field = fieldMatch ? fieldMatch[1] : "";

      try {
        if (field === "me") {
          return reply({
            me: {
              id: userId,
              displayName: this.profiles[userId!] || "Someone",
              email: caller?.email || "",
            },
          });
        }
        if (field === "updateProfile") {
          const parsed = validateDisplayName(vars.displayName);
          if (parsed.error || !parsed.value) return fail(parsed.error || "Invalid name.");
          this.profiles[userId!] = parsed.value;
          return reply({
            updateProfile: {
              id: userId,
              displayName: parsed.value,
              email: caller?.email || "",
            },
          });
        }
        if (field === "myLists") {
          const mine = this.lists
            .filter((l) => l.ownerId === userId || (l.managerIds || []).includes(userId))
            .map((l) => listSummary(l, this.profiles));
          return reply({ myLists: mine });
        }
        if (field === "createList") {
          const parsed = validateListName(vars.name);
          if (parsed.error || !parsed.value) return fail(parsed.error || "Invalid name.");
          const item = {
            id: this.nextId("list"),
            ownerId: userId,
            recipientId: userId,
            recipientName: this.profiles[userId!] || "Someone",
            isChild: false,
            name: parsed.value,
            visibility: "PUBLIC",
            shareToken: this.nextId("tok"),
            createdAt: new Date().toISOString(),
            managerIds: [userId],
          };
          this.lists.push(item);
          return reply({ createList: listSummary(item, this.profiles) });
        }
        if (field === "myList") {
          const list = this.lists.find((l) => l.id === vars.id);
          if (!list || !canManage(list, userId)) return reply({ myList: null });
          return reply({
            myList: shapeMyList(
              list,
              this.gifts[list.id] || [],
              this.claims[list.id] || [],
              userId,
              this.associateTag,
              this.pokes[list.id] || [],
              this.profiles,
            ),
          });
        }
        if (field === "renameList") {
          const list = this.lists.find((l) => l.id === vars.id);
          if (!list || !canManage(list, userId)) return reply({ renameList: null });
          const parsed = validateListName(vars.name);
          if (parsed.error) return fail(parsed.error);
          list.name = parsed.value;
          return reply({ renameList: listSummary(list, this.profiles) });
        }
        if (field === "setListVisibility") {
          const list = this.lists.find((l) => l.id === vars.id);
          if (!list || !canManage(list, userId)) return reply({ setListVisibility: null });
          list.visibility = vars.visibility;
          return reply({ setListVisibility: listSummary(list, this.profiles) });
        }
        if (field === "rotateShareToken") {
          const list = this.lists.find((l) => l.id === vars.id);
          if (!list || !canManage(list, userId)) return reply({ rotateShareToken: null });
          list.shareToken = this.nextId("tok");
          return reply({ rotateShareToken: listSummary(list, this.profiles) });
        }
        if (field === "deleteList") {
          const idx = this.lists.findIndex((l) => l.id === vars.id);
          if (idx === -1 || !canManage(this.lists[idx], userId)) return reply({ deleteList: null });
          const [removed] = this.lists.splice(idx, 1);
          delete this.gifts[removed.id];
          delete this.claims[removed.id];
          delete this.pokes[removed.id];
          return reply({ deleteList: listSummary(removed, this.profiles) });
        }
        if (field === "revealList") {
          const list = this.lists.find((l) => l.id === vars.id);
          if (!list || !canManage(list, userId)) return reply({ revealList: null });
          list.revealedAt = new Date().toISOString();
          return reply({
            revealList: shapeMyList(
              list,
              this.gifts[list.id] || [],
              this.claims[list.id] || [],
              userId,
              this.associateTag,
              this.pokes[list.id] || [],
              this.profiles,
            ),
          });
        }
        if (field === "addChild") {
          const parsed = validateDisplayName(vars.name);
          if (parsed.error || !parsed.value) return fail(parsed.error || "Invalid name.");
          const childId = this.nextId("child");
          const list = {
            id: this.nextId("list"),
            ownerId: userId,
            recipientId: childId,
            recipientName: parsed.value,
            isChild: true,
            name: parsed.value,
            visibility: "PUBLIC",
            shareToken: this.nextId("tok"),
            createdAt: new Date().toISOString(),
            managerIds: [userId],
          };
          this.lists.push(list);
          return reply({ addChild: listSummary(list, this.profiles) });
        }
        if (field === "removeChild") {
          const list = this.lists.find((l) => l.recipientId === vars.childId && canManage(l, userId));
          if (!list) return fail("This child wasn't found.");
          this.lists = this.lists.filter((l) => l.id !== list.id);
          delete this.gifts[list.id];
          delete this.claims[list.id];
          delete this.pokes[list.id];
          return reply({ removeChild: true });
        }
        if (field === "inviteCoManager") {
          const list = this.lists.find((l) => l.recipientId === vars.childId && canManage(l, userId));
          const target = this.users.get(String(vars.email || "").toLowerCase());
          if (!list || !target) return fail("No account uses that email.");
          if (!list.managerIds.includes(target.sub)) list.managerIds.push(target.sub);
          return reply({ inviteCoManager: true });
        }
        if (field === "removeCoManager") {
          const list = this.lists.find((l) => l.recipientId === vars.childId && canManage(l, userId));
          if (!list) return fail("This child wasn't found.");
          list.managerIds = list.managerIds.filter((id: string) => id !== vars.userId);
          return reply({ removeCoManager: true });
        }
        if (field === "addGift") {
          const list = this.lists.find((l) => l.id === vars.listId);
          if (!list || !canManage(list, userId)) return fail("This list wasn't found.");
          const parsed = validateGiftInput(vars);
          if (parsed.error || !parsed.value) return fail(parsed.error || "Invalid gift.");
          const giftId = this.nextId("gift");
          const gift = {
            ...parsed.value,
            id: giftId,
            createdAt: new Date().toISOString(),
          };
          this.gifts[list.id] = (this.gifts[list.id] || []).concat([gift]);
          const claimIds = Array.from({ length: Number(gift.quantity) || 1 }, () => this.nextId("claim"));
          this.claims[list.id] = (this.claims[list.id] || []).concat(
            claimSlots(giftId, gift.quantity, claimIds),
          );
          return reply({ addGift: ownerGiftView(gift, [], false) });
        }
        if (field === "updateGift") {
          const list = this.lists.find((l) => l.id === vars.listId);
          const gifts = this.gifts[vars.listId] || [];
          const current = gifts.find((g) => g.id === vars.id);
          if (!list || !canManage(list, userId) || !current) return fail("This gift wasn't found.");
          const parsed = validateGiftInput({
            kind: current.kind,
            title: vars.title !== undefined ? vars.title : current.title,
            url: vars.url !== undefined ? vars.url : current.url,
            notes: vars.notes !== undefined ? vars.notes : current.notes,
            price: vars.price !== undefined ? vars.price : current.price,
            quantity: vars.quantity !== undefined && vars.quantity !== null ? vars.quantity : current.quantity,
            timingPhrase: vars.timingPhrase || current.timingPhrase,
            membershipPhrase: vars.membershipPhrase || current.membershipPhrase,
          });
          if (parsed.error || !parsed.value) return fail(parsed.error || "Invalid gift.");
          const existingClaims = (this.claims[list.id] || []).filter((c) => c.giftId === current.id);
          const newIds = Array.from({ length: 10 }, () => this.nextId("claim"));
          const change = claimQuantityChange(existingClaims, parsed.value.quantity, current.id, newIds);
          if (change.error) return fail(change.error);
          Object.assign(current, parsed.value);
          const removeSks = new Set(change.remove.map((r: Row) => r.sk));
          this.claims[list.id] = (this.claims[list.id] || [])
            .filter((c) => !removeSks.has(c.sk))
            .concat(change.put);
          return reply({ updateGift: ownerGiftView(current, [], false) });
        }
        if (field === "deleteGift") {
          const list = this.lists.find((l) => l.id === vars.listId);
          const gifts = this.gifts[vars.listId] || [];
          const idx = gifts.findIndex((g) => g.id === vars.id);
          if (!list || !canManage(list, userId) || idx === -1) return fail("This gift wasn't found.");
          const [removed] = gifts.splice(idx, 1);
          this.claims[list.id] = (this.claims[list.id] || []).filter((c) => c.giftId !== removed.id);
          return reply({ deleteGift: ownerGiftView(removed, [], false) });
        }
        if (field === "guestList") {
          const list = this.lists.find((l) => l.shareToken === vars.token);
          return reply({
            guestList: shapeGuestList(
              list,
              list ? this.gifts[list.id] || [] : [],
              list ? this.claims[list.id] || [] : [],
              this.associateTag,
              this.profiles,
            ),
          });
        }
        if (field === "shopList") {
          const list = this.lists.find((l) => l.shareToken === vars.token);
          const friendIds = friendIdsOf(this.rels[userId!] || []);
          return reply({
            shopList: shapeShopperList(
              list,
              list ? this.gifts[list.id] || [] : [],
              list ? this.claims[list.id] || [] : [],
              userId,
              friendIds,
              this.associateTag,
              list ? this.pokes[list.id] || [] : [],
              this.profiles,
            ),
          });
        }
        if (field === "reserveGift") {
          const list = this.lists.find((l) => l.id === vars.listId);
          const friendIds = friendIdsOf(this.rels[userId!] || []);
          const listErr = openListError(list, userId, friendIds);
          if (listErr || !list) return fail(listErr || "This list wasn't found.");
          const gift = (this.gifts[list.id] || []).find((g) => g.id === vars.giftId);
          if (!gift) return fail("This gift wasn't found.");
          const giftClaims = (this.claims[list.id] || []).filter((c) => c.giftId === gift.id);
          const choice = pickReserve(giftClaims, userId);
          if (choice.action === "taken") return fail("Already taken.");
          if (choice.action === "reserve") {
            const noteCheck = validateShopperNote(vars.note || "");
            if (noteCheck.error) return fail(noteCheck.error);
            const target = giftClaims.find((c) => c.slot === choice.slot);
            if (target) {
              target.status = "RESERVED";
              target.shopperId = userId;
              target.shopperName = this.profiles[userId!] || "Shopper";
              target.shopperNote = noteCheck.value;
            }
          }
          return reply({
            reserveGift: shopperGiftView(
              gift,
              this.claims[list.id] || [],
              userId,
              this.associateTag,
              false,
              this.profiles,
            ),
          });
        }
        if (field === "setPurchased" || field === "releaseGift") {
          const list = this.lists.find((l) => l.id === vars.listId);
          const friendIds = friendIdsOf(this.rels[userId!] || []);
          const listErr = openListError(list, userId, friendIds);
          if (listErr || !list) return fail(listErr || "This list wasn't found.");
          const gift = (this.gifts[list.id] || []).find((g) => g.id === vars.giftId);
          const sk = slotKey(vars.giftId, vars.slot);
          const claim = (this.claims[list.id] || []).find((c) => c.sk === sk);
          if (!gift || !claim || claim.shopperId !== userId) {
            return fail("That gift isn't yours to change.");
          }
          if (field === "releaseGift") {
            claim.status = "OPEN";
            delete claim.shopperId;
            delete claim.shopperName;
            delete claim.shopperNote;
          } else {
            claim.status = vars.purchased ? "PURCHASED" : "RESERVED";
            if (vars.note != null) claim.shopperNote = String(vars.note).trim();
          }
          return reply({
            [field]: shopperGiftView(
              gift,
              this.claims[list.id] || [],
              userId,
              this.associateTag,
              false,
              this.profiles,
            ),
          });
        }
        if (field === "pokeList") {
          const list = this.lists.find((l) => l.id === vars.listId);
          const friendIds = friendIdsOf(this.rels[userId!] || []);
          const gifts = list ? this.gifts[list.id] || [] : [];
          if (!list || !canPoke(list, gifts, userId, friendIds, vars.band)) {
            return fail("You can't poke this list for that price band.");
          }
          const existing = this.pokes[list.id] || [];
          const choice = pickPoke(existing, userId, vars.band);
          if (choice.action === "existing") {
            return reply({ pokeList: choice.poke });
          }
          const poke = {
            id: choice.sk,
            sk: choice.sk,
            listId: list.id,
            senderId: userId,
            senderName: this.profiles[userId!] || "Friend",
            ownerId: list.ownerId,
            managerIds: list.managerIds,
            band: vars.band,
            createdAt: new Date().toISOString(),
          };
          this.pokes[list.id] = existing.concat([poke]);
          return reply({ pokeList: poke });
        }
        if (field === "dismissPoke") {
          const list = this.lists.find((l) => l.id === vars.listId);
          if (!list || !canManage(list, userId)) return fail("This list wasn't found.");
          this.pokes[list.id] = (this.pokes[list.id] || []).filter((p) => p.id !== vars.id && p.sk !== vars.id);
          return reply({ dismissPoke: true });
        }
        if (field === "friends") {
          return reply({ friends: shapeFriends(this.rels[userId!] || []) });
        }
        if (field === "sendFriendRequest") {
          const target = this.users.get(String(vars.email || "").toLowerCase());
          if (!target) return fail("No account uses that email.");
          if (target.sub === userId) return fail("You can't add yourself.");
          const myRels = this.rels[userId!] || [];
          if (
            myRels.some(
              (r) =>
                r.sk === `FRIEND#${target.sub}` ||
                r.sk === `FRIEND_OUT#${target.sub}` ||
                r.sk === `FRIEND_IN#${target.sub}`,
            )
          ) {
            return fail("That request already exists.");
          }
          this.rels[userId!] = myRels.concat([
            { sk: `FRIEND_OUT#${target.sub}`, otherId: target.sub, name: this.profiles[target.sub] },
          ]);
          this.rels[target.sub] = (this.rels[target.sub] || []).concat([
            { sk: `FRIEND_IN#${userId}`, otherId: userId, name: this.profiles[userId!] },
          ]);
          return reply({ sendFriendRequest: shapeFriends(this.rels[userId!]) });
        }
        if (field === "acceptFriendRequest") {
          const other = vars.userId;
          this.rels[userId!] = (this.rels[userId!] || [])
            .filter((r) => r.sk !== `FRIEND_IN#${other}`)
            .concat([{ sk: `FRIEND#${other}`, otherId: other, name: this.profiles[other] || "Friend" }]);
          this.rels[other] = (this.rels[other] || [])
            .filter((r) => r.sk !== `FRIEND_OUT#${userId}`)
            .concat([{ sk: `FRIEND#${userId}`, otherId: userId, name: this.profiles[userId!] || "Friend" }]);
          return reply({ acceptFriendRequest: shapeFriends(this.rels[userId!]) });
        }
        if (field === "declineFriendRequest" || field === "cancelFriendRequest" || field === "removeFriend") {
          const other = vars.userId;
          this.rels[userId!] = (this.rels[userId!] || []).filter((r) => !r.sk.endsWith(`#${other}`));
          this.rels[other] = (this.rels[other] || []).filter((r) => !r.sk.endsWith(`#${userId}`));
          if (field === "removeFriend") {
            for (const list of this.lists) {
              this.pokes[list.id] = (this.pokes[list.id] || []).filter(
                (p) =>
                  !(
                    (p.senderId === userId && (p.managerIds || []).includes(other)) ||
                    (p.senderId === other && (p.managerIds || []).includes(userId))
                  ),
              );
            }
          }
          return reply({ [field]: shapeFriends(this.rels[userId!]) });
        }
        if (field === "shoppingList") {
          const rows = this.shopping[userId!] || [{ sk: "LIST", name: "Christmas 2026" }];
          this.shopping[userId!] = rows;
          return reply({ shoppingList: shapeShopping(rows) });
        }
        if (field === "renameShoppingList") {
          const rows = this.shopping[userId!] || [{ sk: "LIST", name: "Christmas 2026" }];
          const listRow = rows.find((r) => r.sk === "LIST");
          if (listRow) listRow.name = vars.name;
          this.shopping[userId!] = rows;
          return reply({ renameShoppingList: shapeShopping(rows) });
        }
        if (field === "addShoppingPerson") {
          const rows = this.shopping[userId!] || [{ sk: "LIST", name: "Christmas 2026" }];
          const id = this.nextId("sp");
          const row = {
            sk: `PERSON#${id}`,
            personId: id,
            name: vars.name,
            personKind: vars.kind,
            refId: vars.refId || null,
            standingNote: null,
          };
          rows.push(row);
          this.shopping[userId!] = rows;
          return reply({
            addShoppingPerson: {
              id,
              name: vars.name,
              kind: vars.kind,
              refId: vars.refId || null,
              standingNote: null,
            },
          });
        }
        if (field === "setStandingNote") {
          const rows = this.shopping[userId!] || [];
          const row = rows.find((r) => r.sk === `PERSON#${vars.personId}`);
          if (!row) return fail("That person isn't on your shopping list.");
          row.standingNote = vars.note;
          return reply({
            setStandingNote: {
              id: row.personId,
              name: row.name,
              kind: row.personKind,
              refId: row.refId,
              standingNote: row.standingNote,
            },
          });
        }
        if (field === "removeShoppingPerson") {
          this.shopping[userId!] = (this.shopping[userId!] || []).filter(
            (r) => r.sk !== `PERSON#${vars.personId}` && !r.sk.startsWith(`PLAN#${vars.personId}#`),
          );
          return reply({ removeShoppingPerson: true });
        }
        if (field === "addPlannedGift") {
          const parsed = validateGiftInput(vars);
          if (parsed.error) return fail(parsed.error);
          const id = this.nextId("plan");
          const row = {
            sk: `PLAN#${vars.personId}#${id}`,
            giftId: id,
            personId: vars.personId,
            ...parsed.value,
            purchased: false,
            againNextYear: false,
          };
          this.shopping[userId!] = (this.shopping[userId!] || []).concat([row]);
          return reply({
            addPlannedGift: { id, personId: vars.personId, ...parsed.value, purchased: false, againNextYear: false },
          });
        }
        if (field === "setPlannedPurchased") {
          const rows = this.shopping[userId!] || [];
          const plan = rows.find((r) => r.sk === `PLAN#${vars.personId}#${vars.id}`);
          const person = rows.find((r) => r.sk === `PERSON#${vars.personId}`);
          if (!plan) return fail("Not found.");
          plan.purchased = vars.purchased;
          if (person?.refId) {
            const recRatings = this.ratings[person.refId] || [];
            const filtered = recRatings.filter((r) => r.sk !== `INBOX#${vars.id}`);
            if (vars.purchased) {
              filtered.push({
                recipientId: person.refId,
                sk: `INBOX#${vars.id}`,
                title: plan.title || "A gift",
                price: plan.price,
                kind: plan.kind,
              });
            }
            this.ratings[person.refId] = filtered;
          }
          return reply({
            setPlannedPurchased: {
              id: plan.giftId,
              personId: plan.personId,
              kind: plan.kind,
              title: plan.title,
              url: plan.url,
              price: plan.price,
              notes: plan.notes,
              timingPhrase: plan.timingPhrase,
              membershipPhrase: plan.membershipPhrase,
              purchased: plan.purchased,
              againNextYear: false,
            },
          });
        }
        if (field === "deletePlannedGift") {
          this.shopping[userId!] = (this.shopping[userId!] || []).filter(
            (r) => r.sk !== `PLAN#${vars.personId}#${vars.id}`,
          );
          return reply({ deletePlannedGift: { id: vars.id } });
        }
        if (field === "setAgainNextYear") {
          const rows = (this.shopping[userId!] || []).filter((r) => r.sk !== `AGAIN#${vars.claimId}`);
          if (vars.again) rows.push({ sk: `AGAIN#${vars.claimId}`, personId: vars.personId, on: true });
          this.shopping[userId!] = rows;
          return reply({ setAgainNextYear: vars.again });
        }
        if (field === "deleteShoppingList") {
          this.shopping[userId!] = [{ sk: "LIST", name: "Christmas 2026" }];
          return reply({ deleteShoppingList: true });
        }
        if (field === "shoppingPerson") {
          const person = (this.shopping[userId!] || []).find((r) => r.sk === `PERSON#${vars.personId}`);
          if (!person) return fail("That person isn't on your shopping list.");
          const friendIds = friendIdsOf(this.rels[userId!] || []);
          const list = this.lists.find((l) => {
            if (l.recipientId !== person.refId) return false;
            if (person.personKind === "CHILD") return canManage(l, userId);
            if (l.visibility === "PRIVATE") return false;
            if (l.visibility === "FRIENDS") return friendIds.includes(l.ownerId);
            return true;
          });
          return reply({
            shoppingPerson: shapeShoppingPerson(
              person.personId,
              list ? list.id : null,
              list ? this.gifts[list.id] || [] : [],
              list ? this.claims[list.id] || [] : [],
              userId,
              this.associateTag,
              list ? this.pokes[list.id] || [] : [],
              this.profiles,
            ),
          });
        }
        if (field === "askForIdeas" || field === "askForShoppingIdeas") {
          const price = vars.band === "UNDER_25" ? 1800 : vars.band === "MID" ? 4500 : 12000;
          return reply({
            [field]: {
              message: null,
              ideas: [
                {
                  title: "Warm wool socks",
                  price,
                  reason: "Fits the winter wishlist.",
                  kind: "CUSTOM",
                  timingPhrase: null,
                  membershipPhrase: null,
                  ratingLine: null,
                },
              ],
            },
          });
        }
        if (field === "receivedGifts") {
          const ownRevealed = this.lists.find(
            (l) => l.recipientId === userId && !l.isChild && l.revealedAt,
          );
          if (!ownRevealed) return reply({ receivedGifts: [] });
          const recRows = this.ratings[userId!] || [];
          const inbox = recRows.filter((r) => r.sk.startsWith("INBOX#"));
          return reply({
            receivedGifts: shapeReceived(
              this.gifts[ownRevealed.id] || [],
              this.claims[ownRevealed.id] || [],
              inbox,
              recRows,
              true,
            ),
          });
        }
        if (field === "rateGift" || field === "rateSuggestion") {
          const id = field === "rateGift" ? vars.giftId : vars.id;
          const recRows = this.ratings[userId!] || [];
          const existing = recRows.find((r) => r.sk === `RATE#${id}`);
          ratingDelta(existing ? existing.stars : null, vars.stars);
          const others = recRows.filter((r) => r.sk !== `RATE#${id}`);
          others.push({ recipientId: userId, sk: `RATE#${id}`, stars: vars.stars, title: "Gift" });
          this.ratings[userId!] = others;
          return reply({
            [field]: {
              id,
              title: "Gift",
              source: field === "rateGift" ? "WISHLIST" : "SUGGESTION",
              stars: vars.stars,
              ratingLine: null,
            },
          });
        }
        return fail(`Unhandled field: ${field}`);
      } catch (err) {
        return fail(err instanceof Error ? err.message : "Fixture error");
      }
    });
  }
}
