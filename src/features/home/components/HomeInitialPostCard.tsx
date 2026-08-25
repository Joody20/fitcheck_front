"use client";

import { useQuery, type InfiniteData } from "@tanstack/react-query";
import type { HomePostApiItem } from "../api/getHomePosts";
import type { GetHomePostsResponse } from "../api/getHomePosts";
import type { HomePost } from "../hooks/useInfiniteHomeFeed";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import HomePostCard from "./HomePostCard";

type Props = {
  post?: HomePostApiItem & { imageUrls: string[] };
};

type HomeFeedInfiniteData = InfiniteData<GetHomePostsResponse, string | null>;

function toHomePost(post: NonNullable<Props["post"]>): HomePost {
  const author = post.author ?? { id: 0, nickname: "" };
  const imageUrls = post.imageUrls ?? [];
  const avatarKey = author.profileImageObjectKey ?? null;

  return {
    id: post.id,
    author: {
      id: author.id,
      displayName: author.nickname ?? "",
      username: author.nickname ?? "",
      avatarUrl: avatarKey ? resolveMediaUrl(avatarKey) : null,
      gender: author.gender ?? null,
      height: author.height ?? null,
      weight: author.weight ?? null,
    },
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    imageCount: imageUrls.length,
    likeCount: Number(post.aggregate?.likeCount ?? 0) || 0,
    commentCount: Number(post.aggregate?.commentCount ?? 0) || 0,
    caption: post.content ?? "",
    tags: post.tags ?? [],
    isLiked: Boolean(post.isLiked),
    isBookmarked: Boolean(post.isBookmarked),
    createdAt: post.createdAt ?? null,
  };
}

/** Renders outside the virtual list so the first feed image is available in
 * the initial server HTML and Next/Image can preload it as the LCP candidate. */
export default function HomeInitialPostCard({ post }: Props) {
  const postId = post?.id;

  const { data: cachedPost } = useQuery<
    HomeFeedInfiniteData,
    Error,
    HomePost | undefined,
    ["home-feed", { size: number }, "infinite"]
  >({
    queryKey: ["home-feed", { size: 10 }, "infinite"],
    // The virtual feed owns fetching; this observer only keeps the SSR card
    // synchronized with its existing cache entry.
    queryFn: async () => ({ pages: [], pageParams: [] }),
    enabled: false,
    select: (data) => {
      const currentPost = data.pages
        .flatMap((page) => page.posts ?? [])
        .find((item) => item.id === postId);
      return currentPost ? toHomePost(currentPost) : undefined;
    },
  });

  if (!post) return null;

  return (
    <div className="mb-10">
      <HomePostCard post={cachedPost ?? toHomePost(post)} prioritizeMedia />
    </div>
  );
}
