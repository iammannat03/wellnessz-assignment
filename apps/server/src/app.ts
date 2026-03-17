import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config/config.js";
import { RegisterRoutes } from "./generated/routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp(): Application {
  const app: Application = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin ? config.corsOrigin.split(",") : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("tiny"));

  app.use(
    "/auth/login",
    rateLimit({
      windowMs: 60_000,
      limit: 10,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );

  RegisterRoutes(app);

  // Serving generated OpenAPI spec via Swagger UI
  const openApiPath = join(process.cwd(), "dist", "openapi", "swagger.json");
  const openApiSpec = JSON.parse(readFileSync(openApiPath, "utf8"));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.use(errorHandler);
  return app;
}
