import { Controller, Get, Route, Tags } from "tsoa";
import type { HealthLiveResponse, HealthReadyResponse } from "@repo/contracts";
import { mongoIsReady } from "../db/mongo.js";
import { getServices } from "../context/services.js";
import { redisPing } from "../redis/client.js";

@Route("health")
@Tags("health")
export class HealthController extends Controller {
  @Get("live")
  public async live(): Promise<HealthLiveResponse> {
    return { status: "ok" };
  }

  @Get("ready")
  public async ready(): Promise<HealthReadyResponse> {
    const s = getServices();
    const mongoOk = mongoIsReady();
    const redisOk = await redisPing(s.redis);
    return {
      status: mongoOk && redisOk ? "ok" : "degraded",
      checks: {
        mongo: mongoOk ? "ok" : "error",
        redis: redisOk ? "ok" : "error",
      },
    };
  }
}

