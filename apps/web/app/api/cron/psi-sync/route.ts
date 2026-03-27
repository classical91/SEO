import { NextResponse } from "next/server";

import { db } from "@rankforge/db";

import { enqueuePageSpeedCollection } from "@/lib/queue";

function isAuthorized(request: Request) {
  const header = request.headers.get("authorization");
  return header === `Bearer ${process.env.NEXTAUTH_SECRET}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await db.project.findMany({
    select: {
      id: true
    }
  });

  await Promise.all(
    projects.map((project) =>
      enqueuePageSpeedCollection({
        projectId: project.id
      })
    )
  );

  return NextResponse.json({ queued: projects.length });
}
