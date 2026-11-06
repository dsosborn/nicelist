import { Amplify } from "aws-amplify";
import {
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
} from "aws-amplify/auth";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";

export const EXT_CONFIG = {
  userPoolId:
    import.meta.env.VITE_COGNITO_USER_POOL_ID || "us-east-1_743Sn3kBe",
  userPoolClientId:
    import.meta.env.VITE_COGNITO_APP_CLIENT_ID || "35nt7od8om91egase6g2r0tbk5",
  cognitoDomain:
    import.meta.env.VITE_COGNITO_DOMAIN ||
    "nicelist-607259655052.auth.us-east-1.amazoncognito.com",
  appSyncEndpoint:
    import.meta.env.VITE_APPSYNC_ENDPOINT ||
    "https://ouptajvy2zdw3butejdqb3ih3u.appsync-api.us-east-1.amazonaws.com/graphql",
};

const OAUTH_STORAGE_KEY = "nicelist.ext.oauthIdToken";

const storage = {
  async setItem(key: string, value: string) {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({ [key]: value });
    } else {
      localStorage.setItem(key, value);
    }
  },
  async getItem(key: string): Promise<string | null> {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const data = await chrome.storage.local.get(key);
      return (data[key] as string | undefined) ?? null;
    }
    return localStorage.getItem(key);
  },
  async removeItem(key: string) {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.remove(key);
    } else {
      localStorage.removeItem(key);
    }
  },
  async clear() {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.clear();
    } else {
      localStorage.clear();
    }
  },
};

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: EXT_CONFIG.userPoolId,
      userPoolClientId: EXT_CONFIG.userPoolClientId,
      loginWith: { email: true },
    },
  },
});
cognitoUserPoolsTokenProvider.setKeyValueStorage(storage);

async function getIdToken(): Promise<string | null> {
  const oauthToken = await storage.getItem(OAUTH_STORAGE_KEY);
  if (oauthToken) return oauthToken;
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

export async function isExtensionSignedIn(): Promise<boolean> {
  const token = await getIdToken();
  if (token) return true;
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

export async function signInWithPassword(email: string, password: string) {
  await storage.removeItem(OAUTH_STORAGE_KEY);
  const res = await signIn({ username: email, password });
  if (!res.isSignedIn) {
    throw new Error("Please finish confirming your account on nicelist.co first.");
  }
}

function base64Url(bytes: Uint8Array): string {
  let str = "";
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function signInWithGoogleInExtension() {
  if (typeof chrome === "undefined" || !chrome.identity?.launchWebAuthFlow) {
    throw new Error("Google sign-in is only available inside Chrome.");
  }
  const redirectUri = chrome.identity.getRedirectURL();
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const verifier = base64Url(verifierBytes);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  const challenge = base64Url(new Uint8Array(digest));

  const authUrl = new URL(`https://${EXT_CONFIG.cognitoDomain}/oauth2/authorize`);
  authUrl.searchParams.set("identity_provider", "Google");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", EXT_CONFIG.userPoolClientId);
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const redirectResponse = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  });
  if (!redirectResponse) {
    throw new Error("Sign-in was canceled.");
  }
  const code = new URL(redirectResponse).searchParams.get("code");
  if (!code) {
    throw new Error("Google sign-in did not return an authorization code.");
  }

  const tokenRes = await fetch(`https://${EXT_CONFIG.cognitoDomain}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: EXT_CONFIG.userPoolClientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }).toString(),
  });
  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) {
    throw new Error("Could not exchange Google sign-in code.");
  }
  await storage.setItem(OAUTH_STORAGE_KEY, tokens.id_token);
}

export async function signOutFromExtension() {
  await storage.removeItem(OAUTH_STORAGE_KEY);
  try {
    await signOut();
  } catch {
    // ignore
  }
}

export type OwnerListOption = {
  id: string;
  name: string;
  recipientName: string;
  isChild: boolean;
};

async function appSync<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = await getIdToken();
  if (!token) throw new Error("Please sign in first.");
  const res = await fetch(EXT_CONFIG.appSyncEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as {
    data?: T;
    errors?: { message?: string }[];
  };
  if (json.errors?.length) {
    throw new Error(json.errors[0].message || "Request failed.");
  }
  if (!json.data) throw new Error("Request failed.");
  return json.data;
}

// Owner view only: the extension never queries claim fields, shopperSlots, or reservations.
export async function fetchOwnerLists(): Promise<OwnerListOption[]> {
  const data = await appSync<{ myLists: OwnerListOption[] }>(
    `query { myLists { id name recipientName isChild } }`,
  );
  return data.myLists;
}

export async function addProductGiftFromExtension(input: {
  listId: string;
  title: string;
  url: string;
  priceCents: number | null;
  notes: string;
}) {
  const data = await appSync<{ addGift: { id: string; title: string | null } }>(
    `mutation ($listId: ID!, $title: String, $url: String, $price: Int, $notes: String) {
      addGift(listId: $listId, kind: PRODUCT, title: $title, url: $url, price: $price, notes: $notes, quantity: 1) {
        id title url price notes quantity
      }
    }`,
    {
      listId: input.listId,
      title: input.title || null,
      url: input.url,
      price: input.priceCents,
      notes: input.notes || null,
    },
  );
  return data.addGift;
}
