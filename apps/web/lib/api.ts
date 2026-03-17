import type {
  AuthRegisterRequest,
  AuthLoginRequest,
  AuthTokenResponse,
  MeResponse,
  ChallengeListQuery,
  ChallengeListResponse,
  ChallengeGetResponse,
  ChallengeCreateRequest,
  ChallengeUpdateRequest,
  MyChallengesResponse,
  JoinChallengeResponse,
  ProgressLogCreateRequest,
  MyLogsResponse,
  ChallengeLeaderboardResponse,
  HealthLiveResponse,
  HealthReadyResponse,
} from "@repo/contracts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const TOKEN_KEY = "wellnessz_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = undefined;
    }
    const message =
      details && typeof details === "object" && "message" in details
        ? (details as { message: string }).message
        : response.statusText;
    throw new ApiError(response.status, message, details);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  auth: {
    register: (data: AuthRegisterRequest) =>
      request<AuthTokenResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    login: (data: AuthLoginRequest) =>
      request<AuthTokenResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    me: () => request<MeResponse>("/me"),
  },

  challenges: {
    list: (query?: ChallengeListQuery) => {
      const params = new URLSearchParams();
      if (query?.metric) params.set("metric", query.metric);
      if (query?.active) params.set("active", query.active);
      const queryString = params.toString();
      return request<ChallengeListResponse>(
        `/challenges${queryString ? `?${queryString}` : ""}`,
      );
    },

    get: (id: string) => request<ChallengeGetResponse>(`/challenges/${id}`),

    create: (data: ChallengeCreateRequest) =>
      request<ChallengeGetResponse>("/challenges", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: ChallengeUpdateRequest) =>
      request<{ updated: boolean }>(`/challenges/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ deleted: boolean }>(`/challenges/${id}`, {
        method: "DELETE",
      }),

    join: (id: string) =>
      request<JoinChallengeResponse>(`/challenges/${id}/join`, {
        method: "POST",
      }),

    myChallenges: () => request<MyChallengesResponse>("/my/challenges"),

    getLogs: (id: string) =>
      request<MyLogsResponse>(`/challenges/${id}/logs/me`),

    logProgress: (id: string, data: ProgressLogCreateRequest) =>
      request<MyLogsResponse>(`/challenges/${id}/logs`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getLeaderboard: (id: string, options?: { nocache?: boolean }) =>
      request<ChallengeLeaderboardResponse>(
        `/challenges/${id}/leaderboard${options?.nocache ? "?nocache=1" : ""}`,
      ),
  },

  health: {
    live: () => request<HealthLiveResponse>("/health/live"),
    ready: () => request<HealthReadyResponse>("/health/ready"),
  },
};

export { ApiError };
