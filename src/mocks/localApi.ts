/**
 * Browser-only data source used by the standalone frontend demo.
 *
 * It deliberately has no network fallback: every response is generated from
 * the seed below (and, in a browser, retained in localStorage for the session).
 */
const STORAGE_KEY = "fitcheck.frontend-demo.data.v1";

type MockPost = {
  id: number;
  content: string;
  imageUrls: string[];
  tags: string[];
  isLiked: boolean;
  isBookmarked: boolean;
  author: { id: number; nickname: string; profileImageUrl: string | null; gender: "M" | "F"; height: number; weight: number };
  aggregate: { likeCount: number; commentCount: number };
  createdAt: string;
};

type Store = {
  posts: MockPost[];
  comments: Record<string, Array<{ id: number; author: { id: number; nickname: string; profileImageUrl: string | null }; content: string; createdAt: string }>>;
  profile: { id: number; nickname: string; profileImageUrl: string | null; gender: "M" | "F"; height: number; weight: number; style: string[]; enableRealtimeNotification: boolean };
  followingIds: number[];
  notifications: Array<{ id: number; type: string; message: string; referenceId: number; actor: { id: number; nicknameSnapshot: string; profileImageObjectKeySnapshot: string | null }; createdAt: string; readAt: string | null }>;
  rooms: Array<{ id: string; title: string; memberCount: number; thumbnailImageUrl: string; isOwner: boolean; joined: boolean }>;
  messages: Record<string, Array<{ id: string; roomId: string; senderId: number; senderNicknameSnapshot: string; senderProfileImageObjectKeySnapshot: string | null; message: string; imageObjectKey: string | null; messageType: string; createdAt: string }>>;
  votes: Array<{ id: number; title: string; isClosed: boolean; items: Array<{ id: string; imageObjectKey: string; sortOrder: number; fitCount: number; fitRate: number }> }>;
};

const media = ["/images/post_ex.webp", "/images/vote_1.jpeg", "/images/vote_2.jpeg", "/images/vote_3.webp", "/images/vote_4.webp"];
const now = () => new Date().toISOString();

function seedStore(): Store {
  const authors = [
    { id: 1, nickname: "핏체크", profileImageUrl: "/icons/user.svg", gender: "F" as const, height: 165, weight: 52 },
    { id: 2, nickname: "데일리룩", profileImageUrl: "/icons/man.svg", gender: "M" as const, height: 178, weight: 72 },
    { id: 3, nickname: "스타일메이트", profileImageUrl: "/icons/woman.svg", gender: "F" as const, height: 160, weight: 48 },
  ];
  const posts = Array.from({ length: 12 }, (_, index): MockPost => ({
    id: index + 1,
    content: ["오늘의 데일리 코디예요. 어떤가요?", "편안한 주말 룩을 공유합니다.", "새로 산 아우터와 함께한 출근룩입니다."][index % 3],
    imageUrls: [media[index % media.length]],
    tags: ["데일리룩", "OOTD", "핏체크"],
    isLiked: index % 4 === 0,
    isBookmarked: index % 5 === 0,
    author: authors[index % authors.length],
    aggregate: { likeCount: 12 + index * 3, commentCount: 1 + (index % 4) },
    createdAt: new Date(Date.now() - index * 3_600_000).toISOString(),
  }));

  return {
    posts,
    comments: {
      "1": [{ id: 1, author: authors[1], content: "색감 조합이 정말 좋아요!", createdAt: now() }],
    },
    profile: { id: 1, nickname: "핏체크", profileImageUrl: "/icons/user.svg", gender: "F", height: 165, weight: 52, style: ["캐주얼", "미니멀"], enableRealtimeNotification: true },
    followingIds: [2],
    notifications: [{ id: 1, type: "LIKE", message: "데일리룩님이 회원님의 게시물을 좋아합니다.", referenceId: 1, actor: { id: 2, nicknameSnapshot: "데일리룩", profileImageObjectKeySnapshot: "/icons/man.svg" }, createdAt: now(), readAt: null }],
    rooms: [
      { id: "1", title: "패션에 고민있는 사람 모여라!", memberCount: 15, thumbnailImageUrl: "/images/chat1.png", isOwner: true, joined: true },
      { id: "2", title: "오늘의 출근룩", memberCount: 8, thumbnailImageUrl: "/images/chat2.png", isOwner: false, joined: true },
      { id: "3", title: "주말 쇼핑 메이트", memberCount: 23, thumbnailImageUrl: "/images/chat3.png", isOwner: false, joined: false },
    ],
    messages: { "1": [{ id: "message-1", roomId: "1", senderId: 2, senderNicknameSnapshot: "데일리룩", senderProfileImageObjectKeySnapshot: "/icons/man.svg", message: "반가워요! 오늘의 코디를 공유해 주세요.", imageObjectKey: null, messageType: "TEXT", createdAt: now() }] },
    votes: [{ id: 1, title: "이번 주 베스트 코디", isClosed: false, items: media.slice(1, 4).map((imageObjectKey, index) => ({ id: `vote-1-${index + 1}`, imageObjectKey, sortOrder: index, fitCount: 8 + index * 4, fitRate: 25 + index * 10 })) }],
  };
}

let memoryStore: Store | null = null;
function store() {
  if (memoryStore) return memoryStore;
  if (typeof window !== "undefined") {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) memoryStore = JSON.parse(saved) as Store;
    } catch { /* use seed */ }
  }
  memoryStore ??= seedStore();
  return memoryStore;
}
function persist() {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store())); } catch { /* quota/private mode */ }
}
function response(data: unknown, status = 200) {
  return new Response(data === undefined ? null : JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
function parseBody(init?: RequestInit) {
  try { return typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : {}; } catch { return {}; }
}
function idFrom(path: string, segment: string) {
  const match = path.match(new RegExp(`${segment}/([^/]+)`));
  return match?.[1] ?? "";
}
function page<T>(items: T[], params: URLSearchParams, cursorName = "after") {
  const size = Number(params.get("size") ?? 20);
  const cursor = Number(params.get(cursorName) ?? 0);
  const list = items.slice(cursor, cursor + size);
  return { items: list, nextCursor: cursor + size < items.length ? String(cursor + size) : null };
}

export function resetMockData() { memoryStore = seedStore(); persist(); }

export async function localApiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(rawUrl, "http://local.fitcheck");
  const path = url.pathname;
  const method = (init.method ?? "GET").toUpperCase();
  const data = store();
  const body = parseBody(init);

  if (path === "/api/auth/tokens") return response({ data: { accessToken: "frontend-demo-token" } });
  if (path === "/api/members/check") return response({ data: { isAvailable: true } });
  if (path === "/api/members/me" && method === "GET") return response({ data: { id: data.profile.id, profile: data.profile, postCount: data.posts.filter((post) => post.author.id === data.profile.id).length, followerCount: 12, followingCount: data.followingIds.length } });
  if (path === "/api/members" && (method === "PATCH" || method === "POST")) {
    Object.assign(data.profile, body); persist(); return response({ data: { id: data.profile.id, profile: data.profile } });
  }
  if (path === "/api/members/me/bookmarks") {
    const result = page(data.posts.filter((post) => post.isBookmarked), url.searchParams);
    return response({ data: { posts: result.items.map((post) => ({ id: post.id, imageObjectKey: post.imageUrls[0], createdAt: post.createdAt })), nextCursor: result.nextCursor } });
  }
  if (/^\/api\/members\/\d+\/posts$/.test(path)) {
    const memberId = Number(idFrom(path, "members")); const result = page(data.posts.filter((post) => post.author.id === memberId), url.searchParams);
    return response({ data: { posts: result.items.map((post) => ({ id: post.id, imageUrls: post.imageUrls, createdAt: post.createdAt })), nextCursor: result.nextCursor } });
  }
  if (/^\/api\/members\/\d+\/(followers|followings)$/.test(path)) {
    const memberId = Number(idFrom(path, "members"));
    const people = data.posts.map((post) => post.author).filter((author, index, all) => author.id !== memberId && all.findIndex((candidate) => candidate.id === author.id) === index);
    return response({ data: { members: people.map((author, index) => ({ followId: index + 1, createdAt: now(), id: author.id, nickname: author.nickname, profileImageObjectKey: author.profileImageUrl })), nextCursor: null } });
  }
  if (/^\/api\/members\/\d+\/follow$/.test(path)) {
    const memberId = Number(idFrom(path, "members"));
    if (method === "POST" && !data.followingIds.includes(memberId)) data.followingIds.push(memberId);
    if (method === "DELETE") data.followingIds = data.followingIds.filter((id) => id !== memberId);
    persist();
    const target = data.posts.find((post) => post.author.id === memberId)?.author;
    return response({ data: { isFollowing: method === "POST", targetId: memberId, targetNickname: target?.nickname ?? "", aggregate: { followerCount: 9, followingCount: data.followingIds.length } } });
  }
  if (/^\/api\/members\/\d+$/.test(path)) {
    const memberId = Number(idFrom(path, "members"));
    const author = data.posts.find((post) => post.author.id === memberId)?.author ?? data.profile;
    return response({ data: { id: memberId, profile: { ...author, heightCm: author.height, weightKg: author.weight, style: ["캐주얼"] }, isFollowing: data.followingIds.includes(memberId), postCount: data.posts.filter((post) => post.author.id === memberId).length, followerCount: 8, followingCount: 4 } });
  }

  if (path === "/api/home/posts" || path === "/api/posts") {
    if (method === "GET") { const result = page(data.posts, url.searchParams); return response({ data: { posts: result.items, nextCursor: result.nextCursor } }); }
    if (method === "POST") {
      const post: MockPost = { id: Math.max(0, ...data.posts.map((item) => item.id)) + 1, content: String(body.content ?? ""), imageUrls: Array.isArray(body.imageObjectKeys) ? body.imageObjectKeys.map(String) : [media[0]], tags: [], isLiked: false, isBookmarked: false, author: { id: data.profile.id, nickname: data.profile.nickname, profileImageUrl: data.profile.profileImageUrl, gender: data.profile.gender, height: data.profile.height, weight: data.profile.weight }, aggregate: { likeCount: 0, commentCount: 0 }, createdAt: now() };
      data.posts.unshift(post); persist(); return response({ data: post }, 201);
    }
  }
  if (path === "/api/home/members") return response({ data: { members: [2, 3].flatMap((id) => { const author = data.posts.find((post) => post.author.id === id)?.author; return author ? [{ id: author.id, nickname: author.nickname, height: author.height, weight: author.weight, styles: ["캐주얼"], profileImageUrl: author.profileImageUrl }] : []; }) } });
  if (path === "/api/search/posts") { const q = (url.searchParams.get("query") ?? "").replace("#", "").toLowerCase(); const result = page(data.posts.filter((post) => !q || `${post.content} ${post.tags.join(" ")}`.toLowerCase().includes(q)), url.searchParams); return response({ data: { posts: result.items, nextCursor: result.nextCursor } }); }
  if (path === "/api/search/users") { const q = (url.searchParams.get("query") ?? "").toLowerCase(); const users = [data.profile, ...data.posts.map((post) => post.author)].filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index).filter((item) => item.nickname.toLowerCase().includes(q)); return response({ data: { members: users, nextCursor: null } }); }

  if (/^\/api\/posts\/[^/]+$/.test(path)) {
    const postId = Number(idFrom(path, "posts")); const post = data.posts.find((item) => item.id === postId);
    if (!post) return response({ message: "게시물을 찾을 수 없습니다." }, 404);
    if (method === "GET") return response({ data: post });
    if (method === "PATCH") { post.content = String(body.content ?? post.content); post.imageUrls = Array.isArray(body.imageObjectKeys) ? body.imageObjectKeys.map(String) : post.imageUrls; persist(); return response({ data: post }); }
    if (method === "DELETE") { data.posts = data.posts.filter((item) => item.id !== postId); persist(); return response({}); }
  }
  const postId = Number(idFrom(path, "posts")); const post = data.posts.find((item) => item.id === postId);
  if (/\/likes$/.test(path) && post) { post.isLiked = method === "POST"; post.aggregate.likeCount += method === "POST" ? 1 : -1; persist(); return response({ data: { isLiked: post.isLiked, likeCount: post.aggregate.likeCount } }); }
  if (/\/bookmarks$/.test(path) && post) { post.isBookmarked = method === "POST"; persist(); return response({ data: { isBookmarked: post.isBookmarked } }); }
  if (/\/viewer-state$/.test(path) && post) return response({ data: { isLiked: post.isLiked, isBookmarked: post.isBookmarked } });
  if (/\/comments(?:\/\d+)?$/.test(path) && post) {
    const commentId = Number((path.match(/comments\/(\d+)/)?.[1]) ?? 0); const comments = data.comments[String(postId)] ?? (data.comments[String(postId)] = []);
    if (!commentId && method === "GET") { const result = page(comments, url.searchParams); return response({ data: { comments: result.items, nextCursor: result.nextCursor } }); }
    if (!commentId && method === "POST") { const comment = { id: Date.now(), author: { id: data.profile.id, nickname: data.profile.nickname, profileImageUrl: data.profile.profileImageUrl }, content: String(body.content ?? ""), createdAt: now() }; comments.push(comment); post.aggregate.commentCount += 1; persist(); return response({ data: comment }, 201); }
    const comment = comments.find((item) => item.id === commentId); if (!comment) return response({}, 404);
    if (method === "PATCH") { comment.content = String(body.content ?? comment.content); persist(); return response({ data: comment }); }
    if (method === "DELETE") { data.comments[String(postId)] = comments.filter((item) => item.id !== commentId); post.aggregate.commentCount -= 1; persist(); return response({}); }
  }

  if (path === "/api/notifications") return response({ data: { notifications: data.notifications, nextCursor: null } });
  if (/^\/api\/notifications\/\d+$/.test(path) && method === "PATCH") { const item = data.notifications.find((notification) => notification.id === Number(idFrom(path, "notifications"))); if (item) item.readAt = now(); persist(); return response({ data: item ?? null }); }

  if (path === "/api/chat/rooms" && method === "GET") return response({ data: { rooms: data.rooms.filter((room) => room.joined).map((room) => ({ ...room, roomId: room.id, participantCount: room.memberCount, thumbnailImageObjectKey: room.thumbnailImageUrl, unreadMessageCount: 0 })) } });
  if (path === "/api/chat/rooms/all") return response({ data: { rooms: data.rooms.map((room) => ({ ...room, roomId: room.id, participantCount: room.memberCount, thumbnailImageObjectKey: room.thumbnailImageUrl })) } });
  if (path === "/api/chat/rooms" && method === "POST") { const room = { id: String(Date.now()), title: String(body.title ?? "새 채팅방"), memberCount: 1, thumbnailImageUrl: String(body.thumbnailImageObjectKey ?? "/images/chat_default.png"), isOwner: true, joined: true }; data.rooms.unshift(room); persist(); return response({ data: { ...room, roomId: room.id, participantCount: room.memberCount, thumbnailImageObjectKey: room.thumbnailImageUrl } }, 201); }
  const roomId = idFrom(path, "rooms"); const room = data.rooms.find((item) => item.id === roomId);
  if (room && /^\/api\/chat\/rooms\/[^/]+$/.test(path)) { if (method === "DELETE") { data.rooms = data.rooms.filter((item) => item.id !== roomId); persist(); return response({}); } if (method === "PATCH") { room.title = String(body.title ?? room.title); persist(); return response({ data: room }); } }
  if (room && /\/join$/.test(path)) { room.joined = true; persist(); return response({ data: room }); }
  if (room && /\/leave$/.test(path)) { room.joined = false; persist(); return response({ data: room }); }
  if (room && /\/messages$/.test(path)) { const messages = data.messages[roomId] ?? (data.messages[roomId] = []); if (method === "GET") { const result = page(messages, url.searchParams); return response({ data: { messages: result.items, nextCursor: result.nextCursor } }); } if (method === "POST") { const message = { id: `message-${Date.now()}`, roomId, senderId: data.profile.id, senderNicknameSnapshot: data.profile.nickname, senderProfileImageObjectKeySnapshot: data.profile.profileImageUrl, message: String(body.message ?? ""), imageObjectKey: body.imageObjectKey ? String(body.imageObjectKey) : null, messageType: body.imageObjectKey ? "IMAGE" : "TEXT", createdAt: now() }; messages.push(message); persist(); return response({ data: message }, 201); } }

  if (path === "/api/votes" && method === "GET") return response({ data: { votes: data.votes.map(({ id, title, isClosed }) => ({ id, title, isClosed })), nextCursor: null } });
  if (path === "/api/votes" && method === "POST") { const vote = { id: Date.now(), title: String(body.title ?? "새 투표"), isClosed: false, items: (Array.isArray(body.imageObjectKeys) ? body.imageObjectKeys : []).map((imageObjectKey, index) => ({ id: `vote-${Date.now()}-${index}`, imageObjectKey: String(imageObjectKey), sortOrder: index, fitCount: 0, fitRate: 0 })) }; data.votes.unshift(vote); persist(); return response({ data: vote }, 201); }
  if (path === "/api/votes/candidates") { const vote = data.votes.find((item) => !item.isClosed) ?? null; return response({ data: vote }); }
  if (/^\/api\/votes\/[^/]+$/.test(path)) { const vote = data.votes.find((item) => String(item.id) === idFrom(path, "votes")); if (!vote) return response({}, 404); if (method === "DELETE") { data.votes = data.votes.filter((item) => item !== vote); persist(); return response({}); } return response({ data: vote }); }
  if (/\/participations$/.test(path)) return response({ data: { success: true } }, 201);

  if (path === "/api/uploads/presign") { const extensions = Array.isArray(body.extensions) ? body.extensions : ["webp"]; return response({ data: { files: extensions.map((extension, index) => ({ uploadUrl: "local://upload", imageObjectKey: media[index % media.length] })) } }); }
  return response({ message: `Unmocked local endpoint: ${method} ${path}` }, 404);
}
