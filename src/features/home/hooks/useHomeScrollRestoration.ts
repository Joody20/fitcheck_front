import { useEffect, useLayoutEffect, useRef } from "react";
import {
  readHomeScrollPosition,
  saveHomeScrollPosition,
} from "../utils/homeScrollPosition";

const MAX_RESTORE_PAGES = 20;
const RESTORE_TIMEOUT_MS = 30_000;

type Options = {
  ready: boolean;
  failed: boolean;
  postsLength: number;
  nextCursor: string | null;
  hasMore: boolean;
  isFetching: boolean;
  loadMore: () => void;
};

export function useHomeScrollRestoration({
  ready,
  failed,
  postsLength,
  nextCursor,
  hasMore,
  isFetching,
  loadMore,
}: Options) {
  const finishedRef = useRef(false);
  const pendingScrollYRef = useRef<number | null>(null);
  const requestedCursorsRef = useRef(new Set<string>());
  const canSaveRef = useRef(false);

  useLayoutEffect(() => {
    pendingScrollYRef.current = readHomeScrollPosition();
    finishedRef.current = pendingScrollYRef.current == null;
    canSaveRef.current = finishedRef.current;
    requestedCursorsRef.current.clear();
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    // 준비/추가 로딩 중 발생하는 스크롤로 원래 목표 좌표를 덮어쓰지 않습니다.
    const saveScroll = () => {
      if (canSaveRef.current && window.location.pathname === "/home") {
        saveHomeScrollPosition();
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") saveScroll();
    };
    const onUserScroll = () => {
      finishedRef.current = true;
      canSaveRef.current = true;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest("input, textarea, select, button"))
      )
        return;
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      ) {
        onUserScroll();
      }
    };

    window.addEventListener("scroll", saveScroll, { passive: true });
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchmove", onUserScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pagehide", saveScroll);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("scroll", saveScroll);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchmove", onUserScroll);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pagehide", saveScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      // 라우트 전환 뒤에는 문서 높이/좌표가 이미 바뀔 수 있습니다.
      // 마지막 홈 scroll 이벤트에서 저장한 좌표를 그대로 유지합니다.
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    if (!ready || finishedRef.current) return;
    // 자동 재시도는 쿼리에 맡기고 복구 자체의 대기 시간은 제한합니다.
    const timerId = window.setTimeout(() => {
      finishedRef.current = true;
    }, RESTORE_TIMEOUT_MS);
    return () => window.clearTimeout(timerId);
  }, [ready]);

  useLayoutEffect(() => {
    if (finishedRef.current) return;
    // 실패 시 목표 좌표를 보존해 다음 홈 방문에서 다시 복구할 수 있습니다.
    if (failed && !isFetching) {
      finishedRef.current = true;
      return;
    }
    if (!ready || isFetching) return;
    const targetY = pendingScrollYRef.current;
    if (targetY == null) return;

    let saveFrameId: number | null = null;
    const restorePosition = () => {
      if (finishedRef.current) return;
      const maxScrollY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );

      if (maxScrollY < targetY - 20 && hasMore) {
        // 게시글 수가 같아도 커서가 진행했다면 다음 페이지를 받을 수 있습니다.
        const requested = requestedCursorsRef.current;
        if (
          !nextCursor ||
          requested.has(nextCursor) ||
          requested.size >= MAX_RESTORE_PAGES
        ) {
          finishedRef.current = true;
          return;
        }
        requested.add(nextCursor);
        loadMore();
        return;
      }

      // 가상 행의 실측 높이가 반영되는 동안 좌표가 다시 움직일 수 있습니다.
      // 연속 프레임에서 위치가 안정된 뒤에만 복구를 완료합니다.
      let stableFrames = 0;
      let attempts = 0;
      const settlePosition = () => {
        if (finishedRef.current) return;
        const currentMax = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight,
        );
        const reachableY = Math.min(targetY, currentMax);
        if (Math.abs(window.scrollY - reachableY) <= 1) {
          stableFrames += 1;
        } else {
          stableFrames = 0;
          window.scrollTo(0, reachableY);
        }
        attempts += 1;
        if (stableFrames >= 3) {
          finishedRef.current = true;
          canSaveRef.current = true;
          saveHomeScrollPosition();
        } else if (attempts >= 30) {
          finishedRef.current = true;
        } else {
          saveFrameId = window.requestAnimationFrame(settlePosition);
        }
      };
      window.scrollTo(0, targetY);
      saveFrameId = window.requestAnimationFrame(settlePosition);
    };
    restorePosition();
    return () => {
      if (saveFrameId != null) window.cancelAnimationFrame(saveFrameId);
    };
  }, [ready, failed, hasMore, isFetching, loadMore, postsLength, nextCursor]);
}
