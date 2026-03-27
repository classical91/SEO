import { NextResponse } from "next/server";

import { db } from "@rankforge/db";

import { enqueueSearchConsoleSync } from "@/lib/queue";

function isAuthorized(request: Request) {
  const header = request.headers.get("authorization");
  return header === `Bearer ${process.env.NEXTAUTH_SECRET}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await db.searchConsoleConnection.findMany({
    select: {
      id: true,
      projectId: true
    }
  });

  await Promise.all(
    connections.map((connection) =>
      enqueueSearchConsoleSync({
        connectionId: connection.id,
        projectId: connection.projectId
      })
    )
  );

  return NextResponse.json({ queued: connections.length });
}
