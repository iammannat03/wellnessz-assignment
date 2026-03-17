import type { RedisClient } from "../redis/client.js";
import { CacheService } from "../services/cacheService.js";
import { AuthService } from "../services/authService.js";
import { ChallengeService } from "../services/challengeService.js";
import { ProgressService } from "../services/progressService.js";
import { LeaderboardService } from "../services/leaderboardService.js";

export type Services = {
  redis: RedisClient;
  cache: CacheService;
  auth: AuthService;
  challenges: ChallengeService;
  progress: ProgressService;
  leaderboard: LeaderboardService;
  cacheTtlSeconds: number;
};

let services: Services | null = null;

export function setServices(s: Services) {
  services = s;
}

export function getServices(): Services {
  if (!services) throw new Error("Services not initialized");
  return services;
}

