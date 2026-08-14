import { authFetch } from "@/src/lib/auth";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import type { HomeRecommendationMember } from "@/src/features/home/types/recommendation";

export type HomeMemberApiItem = {
  id: number;
  nickname: string;
  profileImageObjectKey?: string | null;
  profileImageUrl?: string | null;
  height?: number | null;
  weight?: number | null;
  styles?: string[] | null;
};

export type GetHomeMembersResponse = {
  members: HomeMemberApiItem[];
};

export type HomeMembersFetchOptions = {
  // app router 서버 컴포넌트에서 전달한 Cookie 헤더 문자열
  cookieHeader?: string | null;
  // Next fetch revalidate(seconds)
  revalidate?: number;
};

function normalizeHomeMembersResponse(result: unknown): GetHomeMembersResponse {
  // 백엔드 응답이 { data } 래핑/비래핑 두 케이스 모두 대응
  const data =
    (result as { data?: GetHomeMembersResponse })?.data ??
    (result as GetHomeMembersResponse);
  const members = (data?.members ?? []).map((member) => {
    const avatarKey = member.profileImageObjectKey ?? null;
    return {
      ...member,
      profileImageUrl: avatarKey ? resolveMediaUrl(avatarKey) : null,
    } as HomeMemberApiItem & { profileImageUrl: string | null };
  });
  return { members };
}

export function toRecommendationMembers(
  members: HomeMemberApiItem[],
): HomeRecommendationMember[] {
  // UI 모델을 API 모델에서 분리해서 서버/클라이언트 공용으로 재사용
  return (members ?? []).map((member) => ({
    id: member.id,
    name: member.nickname ?? "",
    heightCm: member.height ?? 0,
    weightKg: member.weight ?? 0,
    styles: member.styles ?? [],
    avatarUrl: member.profileImageUrl ?? null,
  }));
}

export async function getHomeMembers(): Promise<GetHomeMembersResponse> {
  // 클라이언트 패칭 경로: 개인화 데이터이므로 기존 no-store 유지
  const res = await authFetch("/api/home/members", {
    method: "GET",
    cache: "no-store",
  });

  const result = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      return { members: [] };
    }
    throw result;
  }

  return normalizeHomeMembersResponse(result);
}

export async function getHomeMembersServer(
  options: HomeMembersFetchOptions = {},
): Promise<GetHomeMembersResponse> {
  void options;
  const res = await authFetch("/api/home/members", { method: "GET" });
  return normalizeHomeMembersResponse(await res.json());
}
