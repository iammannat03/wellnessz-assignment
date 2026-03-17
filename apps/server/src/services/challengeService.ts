import mongoose from "mongoose";
import { ChallengeModel } from "../models/Challenge.js";
import { ParticipationModel } from "../models/Participation.js";
import { ProgressLogModel } from "../models/ProgressLog.js";
import { badRequest, conflict, forbidden, notFound } from "../utils/httpError.js";
import { isoDateBetween, todayIsoDate } from "../utils/date.js";

export class ChallengeService {
  async createChallenge(userId: string, input: any) {
    if (!input?.title?.trim()) throw badRequest("title is required");
    if (!["steps", "minutes", "liters"].includes(input.metric)) throw badRequest("Invalid metric");
    if (typeof input.dailyTarget !== "number" || input.dailyTarget <= 0)
      throw badRequest("dailyTarget must be > 0");
    if (!input.startDate || !input.endDate) throw badRequest("startDate and endDate required");
    if (input.startDate > input.endDate) throw badRequest("startDate must be <= endDate");
    if (!["public", "private"].includes(input.visibility))
      throw badRequest("Invalid visibility");

    const doc = await ChallengeModel.create({
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      metric: input.metric,
      dailyTarget: input.dailyTarget,
      startDate: input.startDate,
      endDate: input.endDate,
      visibility: input.visibility,
      createdBy: new mongoose.Types.ObjectId(userId),
    });
    await ParticipationModel.create({
      user: new mongoose.Types.ObjectId(userId),
      challenge: doc._id,
    });
    return doc;
  }

  async listChallenges(query: { metric?: string; active?: string }) {
    const filter: any = { visibility: "public" };
    if (query.metric) filter.metric = query.metric;
    if (query.active === "true") {
      const today = todayIsoDate();
      filter.startDate = { $lte: today };
      filter.endDate = { $gte: today };
    }
    if (query.active === "false") {
      const today = todayIsoDate();
      filter.$or = [{ endDate: { $lt: today } }, { startDate: { $gt: today } }];
    }

    const items = await ChallengeModel.find(filter).sort({ createdAt: -1 }).lean();
    return items;
  }

  async getChallenge(challengeId: string) {
    const doc = await ChallengeModel.findById(challengeId).lean();
    if (!doc) throw notFound("Challenge not found");
    return doc;
  }

  async updateChallenge(userId: string, challengeId: string, patch: any) {
    const ch = await ChallengeModel.findById(challengeId);
    if (!ch) throw notFound("Challenge not found");
    if (ch.createdBy.toString() !== userId) throw forbidden("Only creator can update");

    if (patch.title !== undefined) ch.title = String(patch.title).trim();
    if (patch.description !== undefined) ch.description = String(patch.description).trim();
    if (patch.metric !== undefined) {
      if (!["steps", "minutes", "liters"].includes(patch.metric)) throw badRequest("Invalid metric");
      ch.metric = patch.metric;
    }
    if (patch.dailyTarget !== undefined) {
      const v = Number(patch.dailyTarget);
      if (!Number.isFinite(v) || v <= 0) throw badRequest("dailyTarget must be > 0");
      ch.dailyTarget = v;
    }
    if (patch.startDate !== undefined) ch.startDate = String(patch.startDate);
    if (patch.endDate !== undefined) ch.endDate = String(patch.endDate);
    if (ch.startDate > ch.endDate) throw badRequest("startDate must be <= endDate");
    if (patch.visibility !== undefined) {
      if (!["public", "private"].includes(patch.visibility))
        throw badRequest("Invalid visibility");
      ch.visibility = patch.visibility;
    }
    await ch.save();
    return ch.toObject();
  }

  async deleteChallenge(userId: string, challengeId: string) {
    const ch = await ChallengeModel.findById(challengeId);
    if (!ch) throw notFound("Challenge not found");
    if (ch.createdBy.toString() !== userId) throw forbidden("Only creator can delete");

    await Promise.all([
      ParticipationModel.deleteMany({ challenge: ch._id }),
      ProgressLogModel.deleteMany({ challenge: ch._id }),
      ChallengeModel.deleteOne({ _id: ch._id }),
    ]);
    return { deleted: true as const };
  }

  async joinChallenge(userId: string, challengeId: string) {
    const ch = await ChallengeModel.findById(challengeId).lean();
    if (!ch) throw notFound("Challenge not found");
    try {
      await ParticipationModel.create({
        user: new mongoose.Types.ObjectId(userId),
        challenge: new mongoose.Types.ObjectId(challengeId),
      });
    } catch (e: any) {
      if (e?.code === 11000) throw conflict("Already joined");
      throw e;
    }
    return { joined: true as const, challengeId };
  }

  async myChallenges(userId: string) {
    const rows = await ParticipationModel.find({ user: userId })
      .sort({ joinedAt: -1 })
      .populate("challenge")
      .lean();
    const challenges = rows
      .map((r: any) => r.challenge)
      .filter(Boolean);
    return challenges;
  }

  async assertParticipant(userId: string, challengeId: string) {
    const exists = await ParticipationModel.exists({ user: userId, challenge: challengeId });
    if (!exists) throw forbidden("You must join the challenge first");
  }

  async validateLogDate(challengeId: string, date: string) {
    const ch = await ChallengeModel.findById(challengeId).lean();
    if (!ch) throw notFound("Challenge not found");
    if (!isoDateBetween(date, ch.startDate, ch.endDate))
      throw badRequest("date must be within challenge range");
    return ch;
  }
}

