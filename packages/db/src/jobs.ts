import { z } from "zod";

export const JOB_QUEUE_NAME = "rankforge-jobs";

export const jobNames = {
  crawlRun: "crawl.run",
  gscSync: "gsc.sync",
  pageSpeedCollect: "psi.collect",
  aiRecommend: "ai.recommend"
} as const;

export const crawlRunJobPayloadSchema = z.object({
  crawlRunId: z.string(),
  projectId: z.string(),
  domainId: z.string()
});

export const gscSyncJobPayloadSchema = z.object({
  projectId: z.string(),
  connectionId: z.string()
});

export const pageSpeedCollectJobPayloadSchema = z.object({
  projectId: z.string(),
  pageUrls: z.array(z.string().url()).optional()
});

export const aiRecommendJobPayloadSchema = z.object({
  projectId: z.string(),
  crawlRunId: z.string().optional()
});

export type CrawlRunJobPayload = z.infer<typeof crawlRunJobPayloadSchema>;
export type GscSyncJobPayload = z.infer<typeof gscSyncJobPayloadSchema>;
export type PageSpeedCollectJobPayload = z.infer<typeof pageSpeedCollectJobPayloadSchema>;
export type AiRecommendJobPayload = z.infer<typeof aiRecommendJobPayloadSchema>;
