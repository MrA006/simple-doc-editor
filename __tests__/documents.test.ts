import { prisma } from "@/lib/db";

jest.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => {
      if (name === "userId") return { value: "test-user-id" };
      return undefined;
    },
  }),
}));

jest.mock("@/lib/fileParser", () => ({
  parseTxtFile: (content: string) => {
    const paragraphs = content.split(/\n\n+/).filter((p: string) => p.trim());
    return {
      type: "doc",
      content: paragraphs.map((text: string) => ({
        type: "paragraph",
        content: [{ type: "text", text: text.trim() }],
      })),
    };
  },
  parseMdFile: jest.fn(),
  deriveTitle: (filename: string) => {
    const lastDot = filename.lastIndexOf(".");
    return lastDot === -1 ? filename : filename.slice(0, lastDot);
  },
}));

describe("POST /api/documents", () => {
  let testUser: { id: string; email: string; name: string };

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: "test@example.com" },
      update: {},
      create: { id: "test-user-id", email: "test@example.com", name: "Test User" },
    });
  });

  afterAll(async () => {
    await prisma.document.deleteMany({ where: { ownerId: testUser.id } });
    await prisma.user.deleteMany({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  it("should create a document with correct ownerId", async () => {
    const { POST } = await import("@/app/api/documents/route");

    const request = new Request("http://localhost/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Document",
        content: { type: "doc", content: [] },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("Test Document");
    expect(data.ownerId).toBe(testUser.id);
    expect(data.id).toBeDefined();

    await prisma.document.delete({ where: { id: data.id } });
  });

  it("should return 401 if not authenticated", async () => {
    jest.resetModules();
    jest.doMock("next/headers", () => ({
      cookies: () => ({ get: () => undefined }),
    }));

    const { POST } = await import("@/app/api/documents/route");

    const request = new Request("http://localhost/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});

describe("POST /api/documents/import", () => {
  let importUser: { id: string };

  beforeAll(async () => {
    jest.resetModules();
    jest.doMock("next/headers", () => ({
      cookies: () => ({
        get: (name: string) => {
          if (name === "userId") return { value: "import-user-id" };
          return undefined;
        },
      }),
    }));

    jest.doMock("@/lib/fileParser", () => ({
      parseTxtFile: (content: string) => {
        const paragraphs = content.split(/\n\n+/).filter((p: string) => p.trim());
        return {
          type: "doc",
          content: paragraphs.map((text: string) => ({
            type: "paragraph",
            content: [{ type: "text", text: text.trim() }],
          })),
        };
      },
      parseMdFile: jest.fn(),
      deriveTitle: (filename: string) => {
        const lastDot = filename.lastIndexOf(".");
        return lastDot === -1 ? filename : filename.slice(0, lastDot);
      },
    }));

    importUser = await prisma.user.upsert({
      where: { email: "import@example.com" },
      update: {},
      create: { id: "import-user-id", email: "import@example.com", name: "Import User" },
    });
  });

  afterAll(async () => {
    await prisma.document.deleteMany({ where: { ownerId: importUser.id } });
    await prisma.user.deleteMany({ where: { id: importUser.id } });
  });

  it("should import a .txt file with correct paragraph structure", async () => {
    const { POST } = await import("@/app/api/documents/import/route");

    const fileContent = "Hello world\n\nSecond paragraph";
    const blob = new Blob([fileContent], { type: "text/plain" });
    const file = new File([blob], "test-notes.txt", { type: "text/plain" });

    const formData = new FormData();
    formData.append("file", file);

    const request = new Request("http://localhost/api/documents/import", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("test-notes");
    expect(data.ownerId).toBe(importUser.id);
    expect(data.content.type).toBe("doc");
    expect(data.content.content).toHaveLength(2);
    expect(data.content.content[0].content[0].text).toBe("Hello world");

    await prisma.document.delete({ where: { id: data.id } });
  });
});
