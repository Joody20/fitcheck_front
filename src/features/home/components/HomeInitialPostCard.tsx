import type { HomePostApiItem } from "../api/getHomePosts";
import type { HomePost } from "../hooks/useInfiniteHomeFeed";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import HomePostCard from "./HomePostCard";

type Props = {
  post?: HomePostApiItem & { imageUrls: string[] };
};

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
  if (!post) return null;

  return (
    <div className="mb-10">
      <HomePostCard post={toHomePost(post)} prioritizeMedia />
    </div>
  );
}
