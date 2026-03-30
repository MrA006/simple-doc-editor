import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseTxtFile, parseMdFile, deriveTitle } from "@/lib/fileParser";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const isTxt = filename.endsWith(".txt") || file.type === "text/plain";
    const isMd =
      filename.endsWith(".md") || file.type === "text/markdown";

    if (!isTxt && !isMd) {
      return NextResponse.json(
        { error: "Only .txt and .md files are supported" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be under 2MB" },
        { status: 400 }
      );
    }

    const content = await file.text();
    let tiptapJson: object;

    try {
      tiptapJson = isMd ? parseMdFile(content) : parseTxtFile(content);
    } catch {
      return NextResponse.json(
        { error: "Could not parse file content" },
        { status: 400 }
      );
    }

    const title = deriveTitle(file.name);

    const document = await prisma.document.create({
      data: {
        title,
        content: JSON.stringify(tiptapJson),
        ownerId: user.id,
      },
    });

    return NextResponse.json({
      ...document,
      content: JSON.parse(document.content as string),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not parse file content" },
      { status: 400 }
    );
  }
}
