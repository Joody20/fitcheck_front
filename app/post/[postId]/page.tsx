import PostDetailPage from "@/src/features/post/components/PostDetailPage";

type Props = {
  params: Promise<{ postId: string }>;
};

export default async function Page({ params }: Props) {
  const { postId } = await params;
  return <PostDetailPage postId={postId} />;
}
