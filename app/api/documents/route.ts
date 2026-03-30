import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, content } = body;

  const document = await prisma.document.create({
    data: {
      title: title || "Untitled Document",
      content: content ? JSON.stringify(content) : "{}",
      ownerId: user.id,
    },
  });

  return NextResponse.json({
    ...document,
    content: JSON.parse(document.content),
  });
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await prisma.document.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { sharedWith: true } },
    },
  });

  return NextResponse.json({
    documents: documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
      isOwner: true,
      sharedCount: doc._count.sharedWith,
    })),
  });
}
