import { useEffect, useRef } from "react";
import {
  readHomeScrollPosition,
  saveHomeScrollPosition,
} from "../utils/homeScrollPosition";

type Options = {
  postsLength: number;
  hasMore: boolean;
  isFetchingMore: boolean;
  loadMore: () => void;
};

export function useHomeScrollRestoration({
  postsLength,
  hasMore,
  isFetchingMore,
  loadMore,
}: Options) {
  const restoredRef = useRef(false);
  const pendingScrollYRef = useRef<number | null>(null);
  const lastLoadRequestPostsLengthRef = useRef<number | null>(null);
  const restoringRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    pendingScrollYRef.current = readHomeScrollPosition();
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const saveScroll = () => {
      if (!restoringRef.current) saveHomeScrollPosition();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") saveScroll();
    };

    window.addEventListener("scroll", saveScroll, { passive: true });
    window.addEventListener("pagehide", saveScroll);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("scroll", saveScroll);
      window.removeEventListener("pagehide", saveScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      saveScroll();
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || restoredRef.current) return;
    const targetY = pendingScrollYRef.current;
    if (targetY == null) return;

    const restoreWhenReady = () => {
      const maxScrollY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );

      if (maxScrollY < targetY - 20 && hasMore) {
        // 가상 피드는 현재 위치를 기준으로만 다음 페이지를 요청합니다.
        // 복원 대상이 더 아래라면 필요한 높이가 생길 때까지 직접 이어 받습니다.
        if (
          !isFetchingMore &&
          lastLoadRequestPostsLengthRef.current !== postsLength
        ) {
          lastLoadRequestPostsLengthRef.current = postsLength;
          loadMore();
        }
        return;
      }

      restoringRef.current = true;
      window.scrollTo(0, targetY);
      window.requestAnimationFrame(() => {
        restoringRef.current = false;
        saveHomeScrollPosition();
      });
      restoredRef.current = true;
    };

    const frameId = window.requestAnimationFrame(restoreWhenReady);
    return () => window.cancelAnimationFrame(frameId);
  }, [hasMore, isFetchingMore, loadMore, postsLength]);
}
