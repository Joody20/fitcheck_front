"use client";

import { useState } from "react";
import { usePostDetail } from "../hooks/usePostDetail";

import PostHeader from "./PostHeader";
import PostDeleteConfirmModal from "./PostDeleteConfirmModal";
import PostImageCarousel from "./PostImageCarousel";
import PostContent from "./PostContent";
import PostCommentSection from "./PostCommentSection";
import {
  CommentCountProvider,
  useCommentCountStore,
} from "../hooks/useCommentCountStore";

type PostDetailPageProps = {
  postId: string;
};

export default function PostDetailPage({
  postId,
}: PostDetailPageProps) {
  const [likeBurstTrigger, setLikeBurstTrigger] = useState(0);
  const {
    post,
    loading,
    isError,
    sortedImageUrls,
    deleteOpen,
    setDeleteOpen,
    isMine,
    me,
    handleEdit,
    handleDeleteConfirm,
  } = usePostDetail({ postId });

  const commentCountStore = useCommentCountStore(
    post?.aggregate.commentCount ?? 0,
    postId,
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center">
        게시글을 불러올 수 없습니다. 삭제되었거나 존재하지 않는 게시글일 수 있어요.
      </div>
    );
  }

  return (
    <CommentCountProvider value={commentCountStore}>
      <div className="min-h-screen px-2 py-4">
        <PostHeader
          author={post.author}
          createdAt={post.createdAt}
          isMine={isMine}
          onEdit={handleEdit}
          onDelete={() => setDeleteOpen(true)}
        />

        <PostImageCarousel
          images={sortedImageUrls}
          likeBurstTrigger={likeBurstTrigger}
        />

        <PostContent
          key={postId}
          postId={postId}
          content={post.content}
          likeCount={post.aggregate.likeCount}
          isLiked={post.isLiked}
          isBookmarked={post.isBookmarked}
          onLikeBurst={() => setLikeBurstTrigger((prev) => prev + 1)}
        />

        <PostCommentSection
          postId={postId}
          currentUserId={me?.id}
          currentUserNickname={me?.nickname}
          currentUserProfileImageUrl={me?.profileImageUrl}
        />

        <PostDeleteConfirmModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </CommentCountProvider>
  );
}
