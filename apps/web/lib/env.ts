import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_SEARCH_CONSOLE_SCOPES: z.string().optional(),
  REDIS_URL: z.string().optional(),
  PAGESPEED_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-5.4"),
  AI_FEATURE_ENABLED: z.string().default("true"),
  QUEUE_DRIVER: z.enum(["inline", "bullmq"]).default("inline"),
  CRAWL_MAX_PAGES: z.string().default("50"),
  CRAWL_USER_AGENT: z.string().default("RankForgeBot/0.1 (+https://rankforge.local)")
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_SEARCH_CONSOLE_SCOPES: process.env.GOOGLE_SEARCH_CONSOLE_SCOPES,
  REDIS_URL: process.env.REDIS_URL,
  PAGESPEED_API_KEY: process.env.PAGESPEED_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  AI_FEATURE_ENABLED: process.env.AI_FEATURE_ENABLED,
  QUEUE_DRIVER: process.env.QUEUE_DRIVER,
  CRAWL_MAX_PAGES: process.env.CRAWL_MAX_PAGES,
  CRAWL_USER_AGENT: process.env.CRAWL_USER_AGENT
});

export const isGoogleAuthConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
export const isInlineQueueMode = env.QUEUE_DRIVER === "inline" || !env.REDIS_URL;
