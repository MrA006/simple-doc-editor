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

  if (document.ownerId !== user.id) {
    return NextResponse.json(
      { error: "Only the document owner can manage sharing" },
      { status: 403 }
    );
  }

  const shares = await prisma.sharedDoc.findMany({
    where: { documentId: params.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    sharedWith: shares.map((s) => s.user),
  });
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
    return NextResponse.json(
      { error: "Only the document owner can manage sharing" },
      { status: 403 }
    );
  }

  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  if (userId === user.id) {
    return NextResponse.json(
      { error: "You already own this document" },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  const existing = await prisma.sharedDoc.findUnique({
    where: {
      documentId_userId: { documentId: params.id, userId },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Already shared with this user" },
      { status: 409 }
    );
  }

  await prisma.sharedDoc.create({
    data: { documentId: params.id, userId },
  });

  const shares = await prisma.sharedDoc.findMany({
    where: { documentId: params.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    sharedWith: shares.map((s) => s.user),
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

  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const userId = pathParts[pathParts.length - 1];

  const document = await prisma.document.findUnique({
    where: { id: params.id },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.ownerId !== user.id) {
    return NextResponse.json(
      { error: "Only the document owner can manage sharing" },
      { status: 403 }
    );
  }

  const existing = await prisma.sharedDoc.findUnique({
    where: {
      documentId_userId: { documentId: params.id, userId },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  await prisma.sharedDoc.delete({
    where: {
      documentId_userId: { documentId: params.id, userId },
    },
  });

  const shares = await prisma.sharedDoc.findMany({
    where: { documentId: params.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    sharedWith: shares.map((s) => s.user),
  });
}
