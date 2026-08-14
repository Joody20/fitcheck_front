import { localApiFetch } from "@/src/mocks/localApi";
import { normalizeImageUrls } from "@/src/features/upload/utils/normalizeImageUrls";

export type HomeAuthor = {
  id: number;
  nickname: string;
  profileImageObjectKey?: string | null;
  profileImageUrl?: string | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
};

export type HomePostApiItem = {
  id: number;
  imageObjectKeys?: {
    sortOrder?: number | null;
    imageObjectKey?: string | null;
    imageUrl?: string | null;
    accessUrl?: string | null;
    url?: string | null;
  }[];
  content?: string | null;
  tags?: string[] | null;
  isLiked?: boolean | null;
  isBookmarked?: boolean | null;
  author?: HomeAuthor | null;
  aggregate?: {
    likeCount?: number | null;
    commentCount?: number | null;
  } | null;
  createdAt?: string | null;
};

export type GetHomePostsResponse = {
  posts: Array<HomePostApiItem & { imageUrls: string[] }>;
  nextCursor: string | null;
};

export type HomePostsFetchOptions = {
  cookieHeader?: string | null;
  size?: number;
  after?: string | null;
};

function normalizeHomeImageUrls(post: HomePostApiItem) {
  const rawKeys = post.imageObjectKeys ?? [];
  if (!Array.isArray(rawKeys) || rawKeys.length === 0) {
    const fallback =
      (
        post as {
          imageObjectKey?: unknown;
          imageUrls?: unknown;
          imageUrl?: unknown;
        }
      ).imageObjectKey ??
      (post as { imageUrls?: unknown }).imageUrls ??
      (post as { imageUrl?: unknown }).imageUrl ??
      [];
    return normalizeImageUrls(fallback as never);
  }
  const sorted = [...rawKeys].sort(
    (a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0),
  );
  return normalizeImageUrls(
    sorted as unknown as Array<{ imageObjectKey?: string }>,
  );
}

function normalizeHomePostsResponse(result: unknown): GetHomePostsResponse {
  const data =
    (result as { data?: GetHomePostsResponse })?.data ??
    (result as GetHomePostsResponse);

  return {
    ...data,
    posts: (data.posts ?? []).map((post) => {
      const imageUrls = normalizeHomeImageUrls(post);
      return {
        ...post,
        imageObjectKeys: undefined,
        imageUrls,
      };
    }),
  };
}

function buildHomePostsQuery(params?: {
  size?: number;
  after?: string | null;
}) {
  const searchParams = new URLSearchParams();

  if (params?.size) searchParams.set("size", String(params.size));
  if (params?.after) searchParams.set("after", params.after);
  return searchParams.toString();
}

function buildHomePostsUrl(params?: {
  size?: number;
  after?: string | null;
}) {
  const query = buildHomePostsQuery(params);
  return query
    ? `/api/home/posts?${query}`
    : "/api/home/posts";
}

export async function getHomePosts(params?: {
  size?: number;
  after?: string;
}): Promise<GetHomePostsResponse> {
  const res = await localApiFetch(buildHomePostsUrl(params));
  return normalizeHomePostsResponse(await res.json());
}

export async function getHomePostsServer(
  options: HomePostsFetchOptions = {},
): Promise<GetHomePostsResponse> {
  void options.cookieHeader;
  return getHomePosts({ size: options.size, after: options.after ?? undefined });
}
