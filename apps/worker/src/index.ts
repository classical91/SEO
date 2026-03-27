import "dotenv/config";

import { Worker } from "bullmq";
import IORedis from "ioredis";

import {
  JOB_QUEUE_NAME,
  jobNames,
  processAiRecommendations,
  processCrawlRun,
  processPageSpeedCollection,
  processSearchConsoleSync
} from "@rankforge/db";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error("REDIS_URL is required to run the RankForge worker.");
  process.exit(1);
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null
});

const worker = new Worker(
  JOB_QUEUE_NAME,
  async (job) => {
    switch (job.name) {
      case jobNames.crawlRun:
        return processCrawlRun(job.data);
      case jobNames.gscSync:
        return processSearchConsoleSync(job.data);
      case jobNames.pageSpeedCollect:
        return processPageSpeedCollection(job.data);
      case jobNames.aiRecommend:
        return processAiRecommendations(job.data);
      default:
        throw new Error(`Unsupported job ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 3
  }
);

worker.on("completed", (job) => {
  console.log(`Completed ${job.name} (${job.id})`);
});

worker.on("failed", (job, error) => {
  console.error(`Failed ${job?.name} (${job?.id})`, error);
});

async function shutdown(signal: string) {
  console.log(`RankForge worker received ${signal}. Shutting down.`);
  await worker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

console.log("RankForge worker started.");
