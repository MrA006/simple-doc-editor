import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
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

  const existing = await prisma.sharedDoc.findUnique({
    where: {
      documentId_userId: { documentId: params.id, userId: params.userId },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  await prisma.sharedDoc.delete({
    where: {
      documentId_userId: { documentId: params.id, userId: params.userId },
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
