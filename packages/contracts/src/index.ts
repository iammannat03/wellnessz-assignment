export type Id = string;
export type IsoDateString = string; // e.g. "2026-03-13"
export type IsoDateTimeString = string; // e.g. "2026-03-13T12:34:56.000Z"

export type ApiError = {
  error: string;
  message: string;
  details?: unknown;
};

export type Pagination = {
  limit?: number;
  cursor?: string;
};

export type Metric = "steps" | "minutes" | "liters";
export type ChallengeVisibility = "public" | "private";

export type UserPublic = {
  id: Id;
  email: string;
  name: string;
  createdAt: IsoDateTimeString;
};

export type AuthRegisterRequest = {
  email: string;
  password: string;
  name: string;
};

export type AuthLoginRequest = {
  email: string;
  password: string;
};

export type AuthTokenResponse = {
  token: string;
  user: UserPublic;
};

export type MeResponse = {
  user: UserPublic;
};

export type ChallengeCreateRequest = {
  title: string;
  description?: string;
  metric: Metric;
  dailyTarget: number;
  startDate: IsoDateString;
  endDate: IsoDateString;
  visibility: ChallengeVisibility;
};

export type ChallengeUpdateRequest = Partial<
  Pick<
    ChallengeCreateRequest,
    | "title"
    | "description"
    | "metric"
    | "dailyTarget"
    | "startDate"
    | "endDate"
    | "visibility"
  >
>;

export type ChallengeListQuery = {
  metric?: Metric;
  active?: "true" | "false";
};

export type ChallengeSummary = {
  id: Id;
  title: string;
  description?: string;
  metric: Metric;
  dailyTarget: number;
  startDate: IsoDateString;
  endDate: IsoDateString;
  visibility: ChallengeVisibility;
  createdBy: Pick<UserPublic, "id" | "name">;
  participantsCount: number;
};

export type ChallengeDetails = ChallengeSummary & {
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  isParticipant?: boolean;
};

export type ChallengeListResponse = {
  items: ChallengeSummary[];
};

export type ChallengeGetResponse = {
  challenge: ChallengeDetails;
};

export type MyChallengesResponse = {
  items: ChallengeSummary[];
};

export type JoinChallengeResponse = {
  joined: true;
  challengeId: Id;
};

export type ProgressLogCreateRequest = {
  date?: IsoDateString;
  amount: number;
};

export type ProgressLogItem = {
  id: Id;
  challengeId: Id;
  userId: Id;
  date: IsoDateString;
  amount: number;
  createdAt: IsoDateTimeString;
  successful: boolean;
  overachieved: boolean;
};

export type MyLogsResponse = {
  items: ProgressLogItem[];
  stats: {
    successfulDays: number;
    overachievedDays: number;
    currentStreakDays: number;
  };
};

export type LeaderboardEntry = {
  user: Pick<UserPublic, "id" | "name">;
  score: number;
  successfulDays: number;
  overachievedDays: number;
  currentStreakDays: number;
};

export type ChallengeLeaderboardResponse = {
  challengeId: Id;
  items: LeaderboardEntry[];
  computedAt: IsoDateTimeString;
};

export type HealthLiveResponse = {
  status: "ok";
};

export type HealthReadyResponse = {
  status: "ok" | "degraded";
  checks: {
    mongo: "ok" | "error";
    redis: "ok" | "error";
  };
};

