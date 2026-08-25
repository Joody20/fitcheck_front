import { notFound } from "next/navigation";
import { getPostDetailServer } from "@/src/features/post/api/getPostDetailServer";
import PostDetailModal from "@/src/features/post/components/PostDetailModal";

type Props = {
  params: Promise<{ postId: string }>;
};

// 홈에서 카드로 진입한 경우에만 이 라우트가 /post/[postId]를 가로챕니다.
// URL을 직접 열거나 새로고침하면 일반 상세 페이지가 렌더링됩니다.
export default async function HomePostDetailModalPage({ params }: Props) {
  const { postId } = await params;
  const post = await getPostDetailServer(postId);

  if (!post) {
    notFound();
  }

  return <PostDetailModal postId={postId} initialPost={post} />;
}
