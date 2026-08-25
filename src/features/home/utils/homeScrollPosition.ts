const HOME_SCROLL_KEY = "katopia.home.scrollY";
const HOME_POST_FOCUS_KEY = "katopia.home.postFocus";

export type HomePostFocusTarget = {
  postId: number;
  trigger: "media" | "comment";
};

export function saveHomeScrollPosition(scrollY = window.scrollY) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(HOME_SCROLL_KEY, String(scrollY));
  } catch {
    // ignore storage errors
  }
}

export function readHomeScrollPosition() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(HOME_SCROLL_KEY);
    if (!stored) return null;
    const y = Number(stored);
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

export function saveHomePostFocusTarget(target: HomePostFocusTarget) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(HOME_POST_FOCUS_KEY, JSON.stringify(target));
  } catch {
    // ignore storage errors
  }
}

export function readHomePostFocusTarget(): HomePostFocusTarget | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(HOME_POST_FOCUS_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<HomePostFocusTarget>;
    if (
      typeof parsed.postId !== "number" ||
      !Number.isInteger(parsed.postId) ||
      (parsed.trigger !== "media" && parsed.trigger !== "comment")
    ) {
      return null;
    }
    return { postId: parsed.postId, trigger: parsed.trigger };
  } catch {
    return null;
  }
}

export function clearHomePostFocusTarget() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(HOME_POST_FOCUS_KEY);
  } catch {
    // ignore storage errors
  }
}
