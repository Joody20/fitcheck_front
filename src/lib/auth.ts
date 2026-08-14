import { localApiFetch } from "@/src/mocks/localApi";
/* =======================
 * Auth State (Module Scope)
 * ======================= */

let accessToken: string | null = null;
let authInvalidated = false;
let refreshPromise: Promise<string> | null = null;

const ACCESS_TOKEN_KEY = "katopia.accessToken";
const LOGOUT_FLAG_KEY = "katopia.loggedOut";
const HAS_LOGGED_IN_KEY = "katopia.hasLoggedIn";

/* =======================
 * Access Token
 * ======================= */

export function setAccessToken(token: string) {
  accessToken = token;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {}
}

export function getAccessToken() {
  if (accessToken) return accessToken;
  if (typeof window === "undefined") return accessToken;
  try {
    const stored = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (stored) {
      accessToken = stored;
      return stored;
    }
  } catch {}
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {}
}

/* =======================
 * Local / Session Storage
 * ======================= */

export function setLoggedOutFlag(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(LOGOUT_FLAG_KEY, "1");
    } else {
      window.localStorage.removeItem(LOGOUT_FLAG_KEY);
    }
  } catch {}
}

export function isLoggedOutFlag() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LOGOUT_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function setHasLoggedInFlag() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HAS_LOGGED_IN_KEY, "1");
  } catch {}
}

export function hasLoggedInFlag() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(HAS_LOGGED_IN_KEY) === "1";
  } catch {
    return false;
  }
}

/* =======================
 * Auth Invalid State
 * ======================= */

export function isAuthInvalidated() {
  return authInvalidated;
}

export function notifyAuthInvalid() {
  if (authInvalidated) return;

  // 로그인 리다이렉트 중이면 중복 이벤트 방지
  if (typeof window !== "undefined") {
    try {
      if (window.sessionStorage.getItem("katopia.loginRedirect") === "1") {
        return;
      }
    } catch {}
  }

  authInvalidated = true;
  clearAccessToken();
  setLoggedOutFlag(true);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:invalid"));
  }
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token: string, skewSeconds = 30) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  const now = Date.now();
  return payload.exp * 1000 <= now + skewSeconds * 1000;
}

/* =======================
 * Issue Access Token (RT → AT)
 * ======================= */

export async function issueAccessToken() {
  if (isLoggedOutFlag()) {
    // console.log("[issueAccessToken] blocked: loggedOutFlag");
    throw new Error("LOGGED_OUT");
  }
  const existing = getAccessToken();
  if (existing && !isAccessTokenExpired(existing)) {
    return existing;
  }
  // 🔐 재발급은 반드시 단일 Promise
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    // The standalone frontend uses a local demo session instead of refresh
    // cookies and never makes an authentication request.
    const token = "frontend-demo-token";

    setAccessToken(token);
    setLoggedOutFlag(false);
    setHasLoggedInFlag();

    return token;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/* =======================
 * authFetch
 * ======================= */

type AuthFetchInit = RequestInit & { skipAuthRefresh?: boolean };

export async function authFetch(input: RequestInfo, init: AuthFetchInit = {}) {
  // 🔴 이미 세션 종료 상태면 요청 자체 차단
  if (authInvalidated) {
    throw new Error("AUTH_INVALID");
  }
  if (isLoggedOutFlag()) {
    throw new Error("LOGGED_OUT");
  }

  let token = getAccessToken();

  // AT 없으면 1회 재발급
  if ((!token || isAccessTokenExpired(token)) && !init.skipAuthRefresh) {
    token = await issueAccessToken(); // 실패 시 throw
  }

  const makeHeaders = (bearer?: string) => {
    const headers = new Headers(init.headers || {});
    if (bearer) {
      headers.set("Authorization", `Bearer ${bearer}`);
    }
    return headers;
  };

  const requestHeaders = makeHeaders(token ?? undefined);
  // 1차 요청
  let res = await localApiFetch(input, {
    ...init,
    headers: requestHeaders,
    credentials: init.credentials ?? "include",
  });

  if (res.status !== 401 || init.skipAuthRefresh) {
    return res;
  }

  // 🔁 AT 만료 → 1회만 재발급 후 재시도
  try {
    const refreshed = await issueAccessToken();

    res = await localApiFetch(input, {
      ...init,
      headers: makeHeaders(refreshed),
      credentials: init.credentials ?? "include",
    });

    if (res.status === 401) {
      notifyAuthInvalid();
      throw new Error("AUTH_INVALID");
    }

    return res;
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_INVALID") {
      notifyAuthInvalid();
      throw error;
    }
    throw error;
  }
}
