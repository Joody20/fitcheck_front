"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useWindowVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import type { HomePost } from "../hooks/useInfiniteHomeFeed";
import HomePostCard from "./HomePostCard";
import { readHomeScrollPosition } from "../utils/homeScrollPosition";
import { useVirtualFeedLoadMore } from "../hooks/useVirtualFeedLoadMore";

type HomeVirtualFeedProps = {
  posts: HomePost[];
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
};

const DEFAULT_ESTIMATED_ROW_HEIGHT = 500;
const DEFAULT_OVERSCAN = 2;

// 최근 홈 목록 하나만 보관합니다. 목록이나 화면 너비가 달라지면 재측정합니다.
let lastMeasurements: {
  width: number;
  postIds: number[];
  scrollMargin: number;
  rows: VirtualItem[];
} | null = null;

export default function HomeVirtualFeed({
  posts,
  hasMore,
  loading,
  loadMore,
}: HomeVirtualFeedProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [initialMeasurements] = useState(() => {
    if (
      typeof window === "undefined" ||
      !lastMeasurements ||
      lastMeasurements.width !== window.innerWidth ||
      lastMeasurements.postIds.length !== posts.length ||
      !posts.every((post, index) => post.id === lastMeasurements?.postIds[index])
    ) return null;
    return lastMeasurements;
  });
  const [scrollMargin, setScrollMargin] = useState(
    initialMeasurements?.scrollMargin ?? 0,
  );

  useLayoutEffect(() => {
    const updateScrollMargin = () => {
      const container = containerRef.current;
      if (!container) return;
      const next = container.getBoundingClientRect().top + window.scrollY;
      setScrollMargin((prev) => (prev === next ? prev : next));
    };

    updateScrollMargin();
    window.addEventListener("resize", updateScrollMargin);
    window.addEventListener("orientationchange", updateScrollMargin);

    return () => {
      window.removeEventListener("resize", updateScrollMargin);
      window.removeEventListener("orientationchange", updateScrollMargin);
    };
  }, []);

  const { totalCount, isLoaderRow, onVirtualChange } = useVirtualFeedLoadMore({
    itemCount: posts.length,
    hasMore,
    loading,
    loadAhead: 0,
    onLoadMore: loadMore,
  });

  const getItemKey = useCallback(
    (index: number) => posts[index]?.id ?? "home-feed-loader",
    [posts],
  );

  const rowVirtualizer = useWindowVirtualizer({
    count: totalCount,
    initialOffset: () => readHomeScrollPosition() ?? 0,
    initialMeasurementsCache: initialMeasurements?.rows,
    getItemKey,
    estimateSize: () => DEFAULT_ESTIMATED_ROW_HEIGHT,
    overscan: DEFAULT_OVERSCAN,
    scrollMargin,
    onChange: (instance) => {
      if (
        lastMeasurements?.rows !== instance.measurementsCache ||
        lastMeasurements.width !== window.innerWidth ||
        lastMeasurements.scrollMargin !== instance.options.scrollMargin
      ) {
        lastMeasurements = {
          width: window.innerWidth,
          postIds: posts.map((post) => post.id),
          scrollMargin: instance.options.scrollMargin,
          rows: instance.measurementsCache,
        };
      }
      onVirtualChange(instance);
    },
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <section ref={containerRef} className="relative pb-12">
      <div
        className="relative"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map((virtualRow) => {
          if (isLoaderRow(virtualRow.index)) {
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                className="absolute left-0 top-0 w-full px-2 py-6 text-center text-[12px] text-[#777]"
                style={{
                  transform: `translateY(${
                    virtualRow.start - rowVirtualizer.options.scrollMargin
                  }px)`,
                }}
              >
                {loading ? "불러오는 중..." : "더 불러오는 중..."}
              </div>
            );
          }

          const post = posts[virtualRow.index];
          if (!post) return null;

          return (
            <div
              key={virtualRow.key}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              className="absolute left-0 top-0 w-full pb-10"
              style={{
                transform: `translateY(${
                  virtualRow.start - rowVirtualizer.options.scrollMargin
                }px)`,
              }}
            >
              <HomePostCard
                post={post}
                prioritizeMedia={virtualRow.index === 0}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
