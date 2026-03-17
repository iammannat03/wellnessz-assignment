declare module "swagger-ui-express" {
  import type { RequestHandler } from "express";

  export const serve: RequestHandler[];
  export function setup(
    swaggerDoc: unknown,
    options?: {
      explorer?: boolean;
      customCss?: string;
      customCssUrl?: string | string[];
      customJs?: string | string[];
      swaggerOptions?: Record<string, unknown>;
      customSiteTitle?: string;
    },
  ): RequestHandler;
}

