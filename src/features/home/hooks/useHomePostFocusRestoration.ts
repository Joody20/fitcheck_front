import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  clearHomePostFocusTarget,
  readHomePostFocusTarget,
} from "../utils/homeScrollPosition";

export function useHomePostFocusRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/home") return;

    const target = readHomePostFocusTarget();
    if (!target) return;

    let cancelled = false;
    let attempts = 0;
    let timerId: number | null = null;

    const restoreFocus = () => {
      if (cancelled) return;

      const element = document.querySelector<HTMLElement>(
        `[data-home-post-id="${target.postId}"][data-home-post-trigger="${target.trigger}"]`,
      );

      if (element) {
        // 포커스 복귀가 이미 복원된 피드 스크롤을 다시 움직이지 않도록 합니다.
        element.focus({ preventScroll: true });
        clearHomePostFocusTarget();
        return;
      }

      attempts += 1;
      if (attempts < 30) {
        timerId = window.setTimeout(restoreFocus, 100);
      }
    };

    const frameId = window.requestAnimationFrame(restoreFocus);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      if (timerId != null) window.clearTimeout(timerId);
    };
  }, [pathname]);
}
