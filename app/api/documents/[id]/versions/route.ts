import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: params.id },
    select: { id: true, title: true, savedAt: true },
    orderBy: { savedAt: "desc" },
  });

  return NextResponse.json({ versions });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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

  if (document.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { content, title } = body;

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const version = await prisma.documentVersion.create({
    data: {
      documentId: params.id,
      content: typeof content === "string" ? content : JSON.stringify(content),
      title: title || document.title,
    },
  });

  const count = await prisma.documentVersion.count({
    where: { documentId: params.id },
  });

  if (count > 10) {
    const oldest = await prisma.documentVersion.findFirst({
      where: { documentId: params.id },
      orderBy: { savedAt: "asc" },
    });
    if (oldest) {
      await prisma.documentVersion.delete({ where: { id: oldest.id } });
    }
  }

  return NextResponse.json({ version: { id: version.id, savedAt: version.savedAt } });
}
