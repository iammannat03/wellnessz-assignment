import { Controller, Get, Path, Query, Route, Tags } from "tsoa";
import type { ChallengeLeaderboardResponse } from "@repo/contracts";
import { getServices } from "../context/services.js";
import { ChallengeModel } from "../models/Challenge.js";
import { notFound } from "../utils/httpError.js";

@Route("challenges")
@Tags("leaderboard")
export class LeaderboardController extends Controller {
  @Get("{id}/leaderboard")
  public async leaderboard(
    @Path() id: string,
    @Query() nocache?: string,
  ): Promise<ChallengeLeaderboardResponse> {
    const s = getServices();
    const cacheKey = `leaderboard:${id}`;
    const skipCache = nocache === "1" || nocache === "true";

    if (!skipCache) {
      const cached = await s.cache.getJson<ChallengeLeaderboardResponse>(cacheKey);
      if (cached) return cached;
    }

    const ch = await ChallengeModel.findById(id).lean();
    if (!ch) throw notFound("Challenge not found");

    const lb = await s.leaderboard.computeLeaderboard(id);

    const items = await Promise.all(
      lb.items.map(async (row) => {
        const currentStreakDays = await s.leaderboard.computeCurrentStreakDays(
          row.userId,
          id,
          ch.dailyTarget,
          ch.startDate,
        );
        return {
          user: { id: row.userId, name: row.name },
          score: row.score,
          successfulDays: row.successfulDays,
          overachievedDays: row.overachievedDays,
          currentStreakDays,
        };
      }),
    );

    const response: ChallengeLeaderboardResponse = {
      challengeId: id,
      items,
      computedAt: lb.computedAt,
    };
    await s.cache.setJson(cacheKey, response);
    return response;
  }
}

