export interface MockUserProfile {
  id: number;
  nickname: string;
  gender: "MAN" | "WOMAN";
  height: number;
  weight: number;
  profileImage?: string;
  posts: string[];
}

export const MOCK_USERS: MockUserProfile[] = [
  {
    id: 1,
    nickname: "닉네임1",
    gender: "MAN",
    height: 180,
    weight: 80,
    profileImage: undefined,
    posts: Array.from({ length: 6 }).map(
      (_, i) => ["/images/post_ex.webp", "/images/vote_1.jpeg", "/images/vote_2.jpeg"][i % 3],
    ),
  },
  {
    id: 2,
    nickname: "닉네임2",
    gender: "WOMAN",
    height: 165,
    weight: 55,
    profileImage: undefined,
    posts: Array.from({ length: 9 }).map(
      (_, i) => ["/images/vote_3.webp", "/images/vote_4.webp", "/images/post_ex.webp"][i % 3],
    ),
  },
  {
    id: 3,
    nickname: "닉네임3",
    gender: "MAN",
    height: 175,
    weight: 70,
    profileImage: undefined,
    posts: Array.from({ length: 6 }).map(
      (_, i) => ["/images/vote_2.jpeg", "/images/post_ex.webp", "/images/vote_1.jpeg"][i % 3],
    ),
  },
  {
    id: 4,
    nickname: "닉네임4",
    gender: "WOMAN",
    height: 162,
    weight: 52,
    profileImage: undefined,
    posts: Array.from({ length: 6 }).map(
      (_, i) => ["/images/vote_4.webp", "/images/vote_3.webp", "/images/post_ex.webp"][i % 3],
    ),
  },
];
