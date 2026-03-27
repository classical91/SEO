"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CrawlRunStatus, db } from "@rankforge/db";
import { GoogleSearchConsoleService } from "@rankforge/integrations";

import { requireAppUser } from "@/lib/auth";
import { env, isGoogleAuthConfigured } from "@/lib/env";
import {
  enqueueAiRecommendations,
  enqueueCrawlRun,
  enqueuePageSpeedCollection,
  enqueueSearchConsoleSync
} from "@/lib/queue";
import { resolveSearchConsolePropertyInput } from "@/lib/search-console";
import { slugify } from "@/lib/slug";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireProjectMembership(userId: string, projectId: string) {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        memberships: {
          some: {
            userId
          }
        }
      }
    },
    include: {
      searchConsoleConnection: true
    }
  });

  if (!project) {
    throw new Error("Project not found or access denied.");
  }

  return project;
}

async function getGoogleAccount(userId: string) {
  return db.account.findFirst({
    where: {
      userId,
      provider: "google"
    },
    orderBy: {
      updatedAt: "desc"
    }
  });
}

export async function createWorkspaceAction(formData: FormData) {
  const user = await requireAppUser();
  const name = getString(formData, "name");

  if (!name) {
    return;
  }

  const slug = slugify(name);
  const workspace = await db.workspace.create({
    data: {
      name,
      slug,
      ownerId: user.id,
      memberships: {
        create: {
          userId: user.id,
          role: "OWNER"
        }
      }
    }
  });

  redirect(`/app/${workspace.slug}`);
}

export async function createProjectAction(formData: FormData) {
  const user = await requireAppUser();
  const workspaceId = getString(formData, "workspaceId");
  const workspaceSlug = getString(formData, "workspaceSlug");
  const name = getString(formData, "name");
  const description = getString(formData, "description");

  const membership = await db.membership.findFirst({
    where: {
      workspaceId,
      userId: user.id
    }
  });

  if (!membership || !name) {
    return;
  }

  const project = await db.project.create({
    data: {
      workspaceId,
      name,
      slug: slugify(name),
      description
    }
  });

  redirect(`/app/${workspaceSlug}/projects/${project.id}`);
}

export async function addDomainAction(formData: FormData) {
  const user = await requireAppUser();
  const projectId = getString(formData, "projectId");
  const workspaceSlug = getString(formData, "workspaceSlug");
  const homepageUrl = getString(formData, "homepageUrl");
  const parsed = new URL(homepageUrl);
  await requireProjectMembership(user.id, projectId);

  await db.domain.create({
    data: {
      projectId,
      hostname: parsed.hostname,
      homepageUrl: parsed.toString()
    }
  });

  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);
}

export async function startCrawlAction(formData: FormData) {
  const user = await requireAppUser();
  const projectId = getString(formData, "projectId");
  const domainId = getString(formData, "domainId");
  const workspaceSlug = getString(formData, "workspaceSlug");

  await requireProjectMembership(user.id, projectId);

  const crawlRun = await db.crawlRun.create({
    data: {
      projectId,
      domainId,
      triggeredById: user.id,
      status: CrawlRunStatus.QUEUED
    }
  });

  await enqueueCrawlRun({
    crawlRunId: crawlRun.id,
    projectId,
    domainId
  });

  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);
}

export async function connectSearchConsoleAction(formData: FormData) {
  const user = await requireAppUser();
  const projectId = getString(formData, "projectId");
  const workspaceSlug = getString(formData, "workspaceSlug");
  const selectedPropertyUrl = getString(formData, "selectedPropertyUrl");
  const manualPropertyUrl = getString(formData, "manualPropertyUrl");
  const propertyUrl = resolveSearchConsolePropertyInput(selectedPropertyUrl, manualPropertyUrl);
  const propertyLabel = getString(formData, "propertyLabel") || propertyUrl;

  await requireProjectMembership(user.id, projectId);

  let propertyPermissionLevel: string | null = null;

  if (isGoogleAuthConfigured) {
    const account = await getGoogleAccount(user.id);

    if (!account?.refresh_token) {
      throw new Error("Google re-authorization is required before Search Console can be connected.");
    }

    try {
      const properties = await new GoogleSearchConsoleService().listProperties({
        clientId: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        refreshToken: account.refresh_token
      });

      propertyPermissionLevel = properties.find((property) => property.siteUrl === propertyUrl)?.permissionLevel ?? null;
    } catch {
      propertyPermissionLevel = null;
    }
  }

  await db.searchConsoleConnection.upsert({
    where: {
      projectId
    },
    update: {
      connectedById: user.id,
      propertyUrl,
      propertyLabel,
      propertyPermissionLevel,
      lastSyncError: null
    },
    create: {
      projectId,
      connectedById: user.id,
      propertyUrl,
      propertyLabel,
      propertyPermissionLevel
    }
  });

  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}/settings`);
  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);
}

export async function disconnectSearchConsoleAction(formData: FormData) {
  const user = await requireAppUser();
  const projectId = getString(formData, "projectId");
  const workspaceSlug = getString(formData, "workspaceSlug");

  await requireProjectMembership(user.id, projectId);

  await db.searchConsoleConnection.deleteMany({
    where: {
      projectId
    }
  });

  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}/settings`);
  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);
}

export async function syncSearchConsoleAction(formData: FormData) {
  const user = await requireAppUser();
  const connectionId = getString(formData, "connectionId");
  const projectId = getString(formData, "projectId");
  const workspaceSlug = getString(formData, "workspaceSlug");

  const project = await requireProjectMembership(user.id, projectId);

  if (project.searchConsoleConnection?.id !== connectionId) {
    throw new Error("Search Console connection not found for this project.");
  }

  await enqueueSearchConsoleSync({
    connectionId,
    projectId
  });

  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}/settings`);
  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);
}

export async function refreshPageSpeedAction(formData: FormData) {
  const user = await requireAppUser();
  const projectId = getString(formData, "projectId");
  const workspaceSlug = getString(formData, "workspaceSlug");

  await requireProjectMembership(user.id, projectId);

  await enqueuePageSpeedCollection({
    projectId
  });

  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);
}

export async function generateRecommendationsAction(formData: FormData) {
  const user = await requireAppUser();
  const projectId = getString(formData, "projectId");
  const crawlRunId = getString(formData, "crawlRunId");
  const workspaceSlug = getString(formData, "workspaceSlug");

  await requireProjectMembership(user.id, projectId);

  await enqueueAiRecommendations({
    projectId,
    crawlRunId
  });

  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);
}
