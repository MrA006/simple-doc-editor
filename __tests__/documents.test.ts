import { prisma } from "@/lib/db";

// Mock Next.js cookies
jest.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => {
      if (name === "userId") {
        return { value: "test-user-id" };
      }
      return undefined;
    },
  }),
}));

describe("POST /api/documents", () => {
  let testUser: { id: string; email: string; name: string };

  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.document.deleteMany({
      where: { ownerId: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
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
    expect(data.createdAt).toBeDefined();
    expect(data.updatedAt).toBeDefined();

    // Verify content is parsed JSON
    expect(data.content).toEqual({ type: "doc", content: [] });

    // Clean up the created document
    await prisma.document.delete({
      where: { id: data.id },
    });
  });

  it("should return 401 if not authenticated", async () => {
    // Temporarily mock no cookie
    jest.resetModules();
    jest.doMock("next/headers", () => ({
      cookies: () => ({
        get: () => undefined,
      }),
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
