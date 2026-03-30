import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sharedDocs = await prisma.sharedDoc.findMany({
    where: { userId: user.id },
    include: {
      document: {
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { document: { updatedAt: "desc" } },
  });

  return NextResponse.json({
    documents: sharedDocs.map((s) => ({
      id: s.document.id,
      title: s.document.title,
      updatedAt: s.document.updatedAt,
      createdAt: s.document.createdAt,
      isOwner: false,
      owner: s.document.owner,
    })),
  });
}
