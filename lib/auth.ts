import { cookies } from "next/headers";
import { prisma } from "./db";

export async function getCurrentUser() {
  const cookieStore = cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  return user;
}
