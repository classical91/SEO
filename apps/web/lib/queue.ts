import { Queue } from "bullmq";
import IORedis from "ioredis";

import {
  JOB_QUEUE_NAME,
  jobNames,
  processAiRecommendations,
  processCrawlRun,
  processPageSpeedCollection,
  processSearchConsoleSync,
  type AiRecommendJobPayload,
  type CrawlRunJobPayload,
  type GscSyncJobPayload,
  type PageSpeedCollectJobPayload
} from "@rankforge/db";

import { env, isInlineQueueMode } from "./env";

let queue: Queue | null = null;

function getQueue() {
  if (!env.REDIS_URL) {
    throw new Error("REDIS_URL is required for BullMQ mode");
  }

  if (!queue) {
    queue = new Queue(JOB_QUEUE_NAME, {
      connection: new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: null
      })
    });
  }

  return queue;
}

export async function enqueueCrawlRun(payload: CrawlRunJobPayload) {
  if (isInlineQueueMode) {
    return processCrawlRun(payload);
  }

  return getQueue().add(jobNames.crawlRun, payload);
}

export async function enqueueSearchConsoleSync(payload: GscSyncJobPayload) {
  if (isInlineQueueMode) {
    return processSearchConsoleSync(payload);
  }

  return getQueue().add(jobNames.gscSync, payload);
}

export async function enqueuePageSpeedCollection(payload: PageSpeedCollectJobPayload) {
  if (isInlineQueueMode) {
    return processPageSpeedCollection(payload);
  }

  return getQueue().add(jobNames.pageSpeedCollect, payload);
}

export async function enqueueAiRecommendations(payload: AiRecommendJobPayload) {
  if (isInlineQueueMode) {
    return processAiRecommendations(payload);
  }

  return getQueue().add(jobNames.aiRecommend, payload);
}
