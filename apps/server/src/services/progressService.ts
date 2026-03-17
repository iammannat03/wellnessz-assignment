import mongoose from "mongoose";
import { ChallengeModel } from "../models/Challenge.js";
import { ProgressLogModel } from "../models/ProgressLog.js";
import { todayIsoDate } from "../utils/date.js";
import { badRequest, notFound } from "../utils/httpError.js";

export class ProgressService {
  async upsertLog(input: {
    userId: string;
    challengeId: string;
    date?: string;
    amount: number;
  }) {
    if (!Number.isFinite(input.amount) || input.amount < 0)
      throw badRequest("amount must be >= 0");
    const date = input.date ?? todayIsoDate();

    const ch = await ChallengeModel.findById(input.challengeId).lean();
    if (!ch) throw notFound("Challenge not found");
    if (date < ch.startDate || date > ch.endDate)
      throw badRequest("date must be within challenge range");

    const doc = await ProgressLogModel.findOneAndUpdate(
      {
        user: new mongoose.Types.ObjectId(input.userId),
        challenge: new mongoose.Types.ObjectId(input.challengeId),
        date,
      },
      { $inc: { amount: input.amount } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return { doc, challenge: ch };
  }

  async listMyLogs(userId: string, challengeId: string) {
    const ch = await ChallengeModel.findById(challengeId).lean();
    if (!ch) throw notFound("Challenge not found");

    const logs = await ProgressLogModel.find({
      user: userId,
      challenge: challengeId,
    })
      .sort({ date: 1 })
      .lean();

    const successfulDays = logs.filter((l) =>
      meetsTarget(l.amount, ch.dailyTarget),
    ).length;
    const overachievedDays = logs.filter((l) =>
      meetsTarget(l.amount, ch.dailyTarget * 1.5),
    ).length;
    const currentStreakDays = computeCurrentStreak(
      logs,
      ch.dailyTarget,
      ch.startDate,
    );

    return {
      logs,
      stats: { successfulDays, overachievedDays, currentStreakDays },
      challenge: ch,
    };
  }
}

function meetsTarget(amount: number, target: number): boolean {
  return Number(amount) >= Number(target) - 1e-9;
}

function computeCurrentStreak(
  logs: Array<{ date: string; amount: number }>,
  dailyTarget: number,
  challengeStartDate: string,
): number {
  if (logs.length === 0) return 0;

  const byDate = new Map(logs.map((l) => [l.date, l.amount]));
  const dates = Array.from(byDate.keys()).sort();

  let streak = 0;
  let cursor = dates[dates.length - 1]!;

  while (cursor >= challengeStartDate) {
    const amount = byDate.get(cursor);
    if (amount === undefined || !meetsTarget(amount, dailyTarget)) break;
    streak += 1;
    cursor = prevIsoDate(cursor);
  }
  return streak;
}

function prevIsoDate(d: string): string {
  const dt = new Date(`${d}T00:00:00.000Z`);
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}
