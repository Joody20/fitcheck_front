type RevalidateScope = "update" | "delete";

export async function revalidatePostDetail(
  postId: string,
  scope: RevalidateScope = "update",
) {
  void postId;
  void scope;
  return true;
}
