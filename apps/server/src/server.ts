import "dotenv/config";
import { config } from "./config/config.js";
import { connectMongo } from "./db/mongo.js";
import { getRedisClient } from "./redis/client.js";
import { setServices } from "./context/services.js";
import { CacheService } from "./services/cacheService.js";
import { AuthService } from "./services/authService.js";
import { ChallengeService } from "./services/challengeService.js";
import { ProgressService } from "./services/progressService.js";
import { LeaderboardService } from "./services/leaderboardService.js";
import { createApp } from "./app.js";
import { startLeaderboardJob } from "./jobs/leaderboardJob.js";

await connectMongo(config.mongoUri);

const redis = getRedisClient(config.redisUrl);
await redis.connect();

setServices({
  redis,
  cache: new CacheService(redis, config.cacheTtlSeconds),
  auth: new AuthService(),
  challenges: new ChallengeService(),
  progress: new ProgressService(),
  leaderboard: new LeaderboardService(),
  cacheTtlSeconds: config.cacheTtlSeconds,
});

startLeaderboardJob();

const app = createApp();
app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${config.port}`);
});
