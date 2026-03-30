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
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
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

  const shares = await prisma.sharedDoc.findMany({
    where: { documentId: params.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    id: document.id,
    title: document.title,
    content: JSON.parse(document.content as string),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    ownerId: document.ownerId,
    isOwner,
    owner: document.owner,
    sharedWith: shares.map((s) => s.user),
  });
}

export async function PATCH(
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

  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  if (body.title !== undefined) {
    updateData.title = body.title || "Untitled Document";
  }

  if (body.content !== undefined) {
    updateData.content = JSON.stringify(body.content);
  }

  const updated = await prisma.document.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({
    ...updated,
    content: JSON.parse(updated.content as string),
  });
}

export async function DELETE(
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

  await prisma.sharedDoc.deleteMany({
    where: { documentId: params.id },
  });

  await prisma.document.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
