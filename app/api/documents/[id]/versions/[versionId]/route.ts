import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string; versionId: string } }
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await prisma.document.findUnique({
    where: { id: params.id },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const isOwner = document.ownerId === user.id;
  const isShared = await prisma.sharedDoc.findFirst({
    where: { documentId: params.id, userId: user.id },
  });

  if (!isOwner && !isShared) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const version = await prisma.documentVersion.findUnique({
    where: { id: params.versionId, documentId: params.id },
  });

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: version.id,
    title: version.title,
    content: JSON.parse(version.content),
    savedAt: version.savedAt,
  });
}
