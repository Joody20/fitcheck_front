"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PostDetail } from "../types/postDetail";
import PostDetailPage from "./PostDetailPage";

type Props = {
  postId: string;
  initialPost: PostDetail;
};

export default function PostDetailModal({ postId, initialPost }: Props) {
  const router = useRouter();

  useEffect(() => {
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;

    // 모달 끝에서의 wheel/touch 이벤트가 홈 문서까지 전파되지 않게 합니다.
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200]"
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
        className="mx-auto h-full w-full max-w-107.5 overflow-y-auto overscroll-contain bg-white shadow-2xl"
      >
        <PostDetailPage postId={postId} initialPost={initialPost} />
      </section>
    </div>
  );
}
