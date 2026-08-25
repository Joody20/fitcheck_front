"use client";

import { useRouter } from "next/navigation";
import type { PostDetail } from "../types/postDetail";
import PostDetailPage from "./PostDetailPage";

type Props = {
  postId: string;
  initialPost: PostDetail;
};

export default function PostDetailModal({ postId, initialPost }: Props) {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/40"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          router.back();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="게시물 상세"
        className="mx-auto h-full w-full max-w-107.5 overflow-y-auto bg-white shadow-2xl"
      >
        <PostDetailPage postId={postId} initialPost={initialPost} />
      </section>
    </div>
  );
}
