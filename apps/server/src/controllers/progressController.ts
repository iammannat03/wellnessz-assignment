import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import type { MyLogsResponse, ProgressLogCreateRequest } from "@repo/contracts";
import { getServices } from "../context/services.js";

@Route("challenges")
@Tags("progress")
export class ProgressController extends Controller {
  @Post("{id}/logs")
  @Security("jwt")
  public async log(
    @Request() req: any,
    @Path() id: string,
    @Body() body: ProgressLogCreateRequest,
  ): Promise<MyLogsResponse> {
    const s = getServices();
    const userId = String(req?.user?.id ?? "");
    await s.challenges.assertParticipant(userId, id);
    await s.progress.upsertLog({
      userId,
      challengeId: id,
      date: body.date,
      amount: body.amount,
    });
    await s.cache.del(`leaderboard:${id}`);
    await s.cache.delByPrefix(`leaderboard:${id}`);
    const { logs, stats, challenge } = await s.progress.listMyLogs(userId, id);
    return {
      items: logs.map((l: any) => ({
        id: l._id.toString(),
        challengeId: l.challenge.toString(),
        userId: l.user.toString(),
        date: l.date,
        amount: l.amount,
        createdAt: l.createdAt.toISOString(),
        successful: l.amount >= challenge.dailyTarget,
        overachieved: l.amount >= challenge.dailyTarget * 1.5,
      })),
      stats,
    };
  }

  @Get("{id}/logs/me")
  @Security("jwt")
  public async myLogs(
    @Request() req: any,
    @Path() id: string,
  ): Promise<MyLogsResponse> {
    const s = getServices();
    const userId = String(req?.user?.id ?? "");
    await s.challenges.assertParticipant(userId, id);

    const { logs, stats, challenge } = await s.progress.listMyLogs(userId, id);
    return {
      items: logs.map((l: any) => ({
        id: l._id.toString(),
        challengeId: l.challenge.toString(),
        userId: l.user.toString(),
        date: l.date,
        amount: l.amount,
        createdAt: l.createdAt.toISOString(),
        successful: l.amount >= challenge.dailyTarget,
        overachieved: l.amount >= challenge.dailyTarget * 1.5,
      })),
      stats,
    };
  }
}
