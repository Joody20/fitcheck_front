import "server-only";

import { localApiFetch } from "@/src/mocks/localApi";
import type { PostDetail } from "@/src/features/post/types/postDetail";

type PostDetailApiResponse = {
  data?: PostDetail;
};

export async function getPostDetailServer(
  postId: string,
): Promise<PostDetail | null> {
  const res = await localApiFetch(`/api/posts/${postId}`);

  const json = (await res.json().catch(() => null)) as PostDetailApiResponse;
  if (!res.ok) {
    return null;
  }
  return json?.data ?? null;
}
