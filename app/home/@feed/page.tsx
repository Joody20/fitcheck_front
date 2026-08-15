import { cookies } from "next/headers";
import HomeFeedSectionClient from "@/src/features/home/components/HomeFeedSectionClient";
import HomeInitialPostCard from "@/src/features/home/components/HomeInitialPostCard";
import { getHomePostsServer } from "@/src/features/home/api/getHomePosts";

function toCookieHeader(entries: { name: string; value: string }[]) {
  return entries.map((entry) => `${entry.name}=${entry.value}`).join("; ");
}

export default async function HomeFeedSlotPage() {
  const cookieStore = await cookies();
  const cookieHeader = toCookieHeader(cookieStore.getAll());
  const firstFeed = await getHomePostsServer({
    cookieHeader,
    size: 10,
    after: null,
  });

  const [initialPost, ...virtualPosts] = firstFeed.posts;
  const virtualFeed = { ...firstFeed, posts: virtualPosts };

  return (
    <>
      <HomeInitialPostCard post={initialPost} />
      <HomeFeedSectionClient size={10} initialFeed={virtualFeed} />
    </>
  );
}
