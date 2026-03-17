import mongoose from "mongoose";
import { ChallengeModel } from "../models/Challenge.js";
import { ParticipationModel } from "../models/Participation.js";
import { ProgressLogModel } from "../models/ProgressLog.js";
import { UserModel } from "../models/User.js";
import { notFound } from "../utils/httpError.js";

export type LeaderboardRow = {
  userId: string;
  name: string;
  score: number;
  successfulDays: number;
  overachievedDays: number;
};

export class LeaderboardService {
  async computeLeaderboard(challengeId: string): Promise<{
    challengeId: string;
    computedAt: string;
    items: LeaderboardRow[];
  }> {
    const ch = await ChallengeModel.findById(challengeId).lean();
    if (!ch) throw notFound("Challenge not found");

    const pipeline: any[] = [
      { $match: { challenge: new mongoose.Types.ObjectId(challengeId) } },
      {
        $lookup: {
          from: "progress_logs",
          let: { uid: "$user", cid: "$challenge" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user", "$$uid"] },
                    { $eq: ["$challenge", "$$cid"] },
                  ],
                },
              },
            },
            { $project: { amount: 1 } },
          ],
          as: "logs",
        },
      },
      {
        $addFields: {
          successfulDays: {
            $size: {
              $filter: {
                input: "$logs",
                as: "l",
                cond: { $gte: ["$$l.amount", ch.dailyTarget] },
              },
            },
          },
          overachievedDays: {
            $size: {
              $filter: {
                input: "$logs",
                as: "l",
                cond: { $gte: ["$$l.amount", ch.dailyTarget * 1.5] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          score: {
            $reduce: {
              input: "$logs",
              initialValue: 0,
              in: {
                $cond: [
                  { $lt: ["$$this.amount", ch.dailyTarget] },
                  "$$value",
                  {
                    $add: [
                      "$$value",
                      10,
                      {
                        $cond: [
                          { $lt: ["$$this.amount", ch.dailyTarget * 1.5] },
                          0,
                          {
                            $add: [
                              5,
                              {
                                $min: [
                                  10,
                                  {
                                    $max: [
                                      0,
                                      {
                                        $floor: {
                                          $multiply: [
                                            {
                                              $subtract: [
                                                {
                                                  $divide: [
                                                    "$$this.amount",
                                                    ch.dailyTarget,
                                                  ],
                                                },
                                                1.5,
                                              ],
                                            },
                                            10,
                                          ],
                                        },
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      { $sort: { score: -1, overachievedDays: -1, successfulDays: -1 } },
      {
        $project: {
          user: 1,
          score: 1,
          successfulDays: 1,
          overachievedDays: 1,
        },
      },
    ];

    const rows = (await ParticipationModel.aggregate(pipeline)) as Array<{
      user: mongoose.Types.ObjectId;
      score: number;
      successfulDays: number;
      overachievedDays: number;
    }>;

    const userIds = rows.map((r) => r.user);
    const users = await UserModel.find({ _id: { $in: userIds } })
      .select({ name: 1 })
      .lean();
    const nameById = new Map(users.map((u) => [u._id.toString(), u.name]));

    return {
      challengeId,
      computedAt: new Date().toISOString(),
      items: rows.map((r) => ({
        userId: r.user.toString(),
        name: nameById.get(r.user.toString()) ?? "Unknown",
        score: r.score ?? 0,
        successfulDays: r.successfulDays ?? 0,
        overachievedDays: r.overachievedDays ?? 0,
      })),
    };
  }

  async computeCurrentStreakDays(
    userId: string,
    challengeId: string,
    dailyTarget: number,
    challengeStartDate: string,
  ) {
    const logs = await ProgressLogModel.find({
      user: userId,
      challenge: challengeId,
    })
      .select({ date: 1, amount: 1 })
      .sort({ date: 1 })
      .lean();
    return computeCurrentStreak(logs, dailyTarget, challengeStartDate);
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
