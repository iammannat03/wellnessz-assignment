import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Query,
  Request,
  Route,
  Patch,
  Security,
  Tags,
} from "tsoa";
import type {
  ChallengeCreateRequest,
  ChallengeGetResponse,
  ChallengeListQuery,
  ChallengeListResponse,
  ChallengeUpdateRequest,
  JoinChallengeResponse,
  MyChallengesResponse,
} from "@repo/contracts";
import mongoose from "mongoose";
import { UserModel } from "../models/User.js";
import { getServices } from "../context/services.js";
import { ChallengeModel } from "../models/Challenge.js";
import { ParticipationModel } from "../models/Participation.js";
import { notFound } from "../utils/httpError.js";
import { tryGetUserId } from "../authentication.js";

function toSummary(ch: any, participantsCount: number) {
  return {
    id: ch._id.toString(),
    title: ch.title,
    description: ch.description ?? undefined,
    metric: ch.metric,
    dailyTarget: ch.dailyTarget,
    startDate: ch.startDate,
    endDate: ch.endDate,
    visibility: ch.visibility,
    createdBy: { id: ch.createdBy.toString(), name: ch.createdByName ?? "Unknown" },
    participantsCount,
  };
}

@Route("challenges")
@Tags("challenges")
export class ChallengeController extends Controller {
  @Get("")
  public async list(
    @Query() metric?: ChallengeListQuery["metric"],
    @Query() active?: ChallengeListQuery["active"],
  ): Promise<ChallengeListResponse> {
    const s = getServices();
    const cacheKey = `challenges:list:metric=${metric ?? ""}:active=${active ?? ""}`;
    const cached = await s.cache.getJson<ChallengeListResponse>(cacheKey);
    if (cached) return cached;

    const items = await s.challenges.listChallenges({ metric, active });
    const ids = items.map((i: any) => i._id);
    const counts = await ParticipationModel.aggregate([
      { $match: { challenge: { $in: ids } } },
      { $group: { _id: "$challenge", c: { $sum: 1 } } },
    ]);
    const countById = new Map(counts.map((r) => [r._id.toString(), r.c]));

    const creators = await UserModel.find({ _id: { $in: items.map((i: any) => i.createdBy) } })
      .select({ name: 1 })
      .lean();
    const nameById = new Map(creators.map((u: any) => [u._id.toString(), u.name]));

    const response: ChallengeListResponse = {
      items: items.map((ch: any) =>
        toSummary(
          { ...ch, createdByName: nameById.get(ch.createdBy.toString()) },
          countById.get(ch._id.toString()) ?? 0,
        ),
      ),
    };
    await s.cache.setJson(cacheKey, response);
    return response;
  }

  @Post("")
  @Security("jwt")
  public async create(
    @Request() req: any,
    @Body() body: ChallengeCreateRequest,
  ): Promise<ChallengeGetResponse> {
    const s = getServices();
    const userId = String(req?.user?.id ?? "");
    const doc = await s.challenges.createChallenge(userId, body);
    await s.cache.delByPrefix("challenges:list:");
    const participantsCount = await ParticipationModel.countDocuments({
      challenge: doc._id,
    });
    const creator = await UserModel.findById(doc.createdBy).select({ name: 1 }).lean();
    return {
      challenge: {
        ...toSummary(
          { ...doc.toObject(), createdByName: creator?.name ?? "Unknown" },
          participantsCount,
        ),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        isParticipant: true, // creator is always participant
      },
    };
  }

  @Get("{id}")
  public async get(@Request() req: any, @Path() id: string): Promise<ChallengeGetResponse> {
    const doc = await ChallengeModel.findById(id).lean();
    if (!doc) throw notFound("Challenge not found");
    const participantsCount = await ParticipationModel.countDocuments({ challenge: id });
    const creator = await UserModel.findById(doc.createdBy).select({ name: 1 }).lean();
    const challenge = {
      ...toSummary(
        { ...doc, createdByName: creator?.name ?? "Unknown" },
        participantsCount,
      ),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
    const userId = tryGetUserId(req);
    if (userId) {
      const isParticipant = await ParticipationModel.exists({
        user: userId,
        challenge: id,
      });
      (challenge as { isParticipant?: boolean }).isParticipant = !!isParticipant;
    }
    return { challenge };
  }

  @Patch("{id}")
  @Security("jwt")
  public async update(
    @Request() req: any,
    @Path() id: string,
    @Body() body: ChallengeUpdateRequest,
  ) {
    const s = getServices();
    const userId = String(req?.user?.id ?? "");
    await s.challenges.updateChallenge(userId, id, body);
    await s.cache.delByPrefix("challenges:list:");
    await s.cache.delByPrefix(`leaderboard:${id}`);
    return { updated: true };
  }

  @Delete("{id}")
  @Security("jwt")
  public async remove(@Request() req: any, @Path() id: string) {
    const s = getServices();
    const userId = String(req?.user?.id ?? "");
    await s.challenges.deleteChallenge(userId, id);
    await s.cache.delByPrefix("challenges:list:");
    await s.cache.delByPrefix(`leaderboard:${id}`);
    return { deleted: true };
  }

  @Post("{id}/join")
  @Security("jwt")
  public async join(@Request() req: any, @Path() id: string): Promise<JoinChallengeResponse> {
    const s = getServices();
    const userId = String(req?.user?.id ?? "");
    const res = await s.challenges.joinChallenge(userId, id);
    await s.cache.delByPrefix("challenges:list:");
    await s.cache.delByPrefix(`leaderboard:${id}`);
    return res;
  }
}

@Route("my")
@Tags("challenges")
export class MyChallengeController extends Controller {
  @Get("challenges")
  @Security("jwt")
  public async myChallenges(@Request() req: any): Promise<MyChallengesResponse> {
    const s = getServices();
    const userId = String(req?.user?.id ?? "");
    const items = await s.challenges.myChallenges(userId);
    const counts = await ParticipationModel.aggregate([
      { $match: { challenge: { $in: items.map((c: any) => c._id) } } },
      { $group: { _id: "$challenge", c: { $sum: 1 } } },
    ]);
    const countById = new Map(counts.map((r) => [r._id.toString(), r.c]));
    const creators = await UserModel.find({ _id: { $in: items.map((i: any) => i.createdBy) } })
      .select({ name: 1 })
      .lean();
    const nameById = new Map(creators.map((u: any) => [u._id.toString(), u.name]));
    return {
      items: items.map((ch: any) =>
        toSummary(
          { ...ch, createdByName: nameById.get(ch.createdBy.toString()) },
          countById.get(ch._id.toString()) ?? 0,
        ),
      ),
    };
  }
}

