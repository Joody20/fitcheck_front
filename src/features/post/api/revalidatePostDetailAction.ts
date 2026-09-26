"use server";

import { revalidatePath } from "next/cache";

export async function revalidatePostDetailAction(postId: string) {
  if (!/^[1-9]\d*$/.test(postId)) {
    throw new Error("Invalid post ID");
  }

  revalidatePath(`/post/${postId}`);
}
