import cron from "node-cron";
import { ChallengeModel } from "../models/Challenge.js";
import { todayIsoDate } from "../utils/date.js";
import { getServices } from "../context/services.js";

export function startLeaderboardJob() {
  // Every hour: recompute cached leaderboards for active challenges
  cron.schedule("0 * * * *", async () => {
    const s = getServices();
    const today = todayIsoDate();
    const active = await ChallengeModel.find({
      startDate: { $lte: today },
      endDate: { $gte: today },
    })
      .select({ _id: 1 })
      .lean();

    for (const ch of active) {
      const key = `leaderboard:${ch._id.toString()}`;
      try {
        const res = await s.leaderboard.computeLeaderboard(ch._id.toString());
        await s.cache.setJson(key, res, 60 * 10);
      } catch {
        // ignore per-challenge failures
      }
    }
  });
}
