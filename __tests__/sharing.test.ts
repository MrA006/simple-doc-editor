import { prisma } from "@/lib/db";

jest.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => {
      if (name === "userId") {
        return { value: "owner-user-id" };
      }
      return undefined;
    },
  }),
}));

describe("Sharing API", () => {
  let ownerUser: { id: string; email: string; name: string };
  let sharedUser: { id: string; email: string; name: string };
  let testDoc: { id: string; ownerId: string };

  beforeAll(async () => {
    ownerUser = await prisma.user.create({
      data: {
        id: "owner-user-id",
        email: "owner@example.com",
        name: "Owner",
      },
    });

    sharedUser = await prisma.user.create({
      data: {
        id: "shared-user-id",
        email: "shared@example.com",
        name: "Shared User",
      },
    });

    testDoc = await prisma.document.create({
      data: {
        title: "Share Test Doc",
        content: "{}",
        ownerId: ownerUser.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.sharedDoc.deleteMany({
      where: { documentId: testDoc.id },
    });
    await prisma.document.deleteMany({
      where: { ownerId: { in: [ownerUser.id, sharedUser.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerUser.id, sharedUser.id] } },
    });
    await prisma.$disconnect();
  });

  it("should add a share and return updated list", async () => {
    const { POST } = await import(
      "@/app/api/documents/[id]/shares/route"
    );

    const request = new Request(
      `http://localhost/api/documents/${testDoc.id}/shares`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: sharedUser.id }),
      }
    );

    const response = await POST(request, { params: { id: testDoc.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sharedWith).toHaveLength(1);
    expect(data.sharedWith[0].id).toBe(sharedUser.id);
    expect(data.sharedWith[0].name).toBe("Shared User");

    await prisma.sharedDoc.delete({
      where: {
        documentId_userId: {
          documentId: testDoc.id,
          userId: sharedUser.id,
        },
      },
    });
  });

  it("should return shared documents for the shared user", async () => {
    await prisma.sharedDoc.create({
      data: { documentId: testDoc.id, userId: sharedUser.id },
    });

    jest.resetModules();
    jest.doMock("next/headers", () => ({
      cookies: () => ({
        get: (name: string) => {
          if (name === "userId") {
            return { value: "shared-user-id" };
          }
          return undefined;
        },
      }),
    }));

    const { GET } = await import("@/app/api/documents/shared/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.documents).toHaveLength(1);
    expect(data.documents[0].id).toBe(testDoc.id);
    expect(data.documents[0].isOwner).toBe(false);
    expect(data.documents[0].owner.name).toBe("Owner");

    await prisma.sharedDoc.delete({
      where: {
        documentId_userId: {
          documentId: testDoc.id,
          userId: sharedUser.id,
        },
      },
    });
  });
});
