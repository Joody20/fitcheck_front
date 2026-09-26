import { revalidatePostDetailAction } from "./revalidatePostDetailAction";

type RevalidateScope = "update" | "delete";

export async function revalidatePostDetail(
  postId: string,
  scope: RevalidateScope = "update",
) {
  try {
    await revalidatePostDetailAction(postId);
    return true;
  } catch (error) {
    // The mutation already succeeded; do not roll back optimistic UI because
    // a subsequent cache invalidation request failed.
    console.error("Failed to revalidate post detail", { postId, scope, error });
    return false;
  }
}
