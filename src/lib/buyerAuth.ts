import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

// Mismo mecanismo que src/lib/auth.ts (sesión = fila en la base, la cookie
// solo guarda su id al azar) pero separado por completo: un comprador nunca
// comparte sesión ni cookie con una cuenta de organizador o staff.

const COOKIE_NAME = "buyer_session";
const SESSION_DAYS = 60; // compradores vuelven cada tanto, no cada noche

export async function createBuyerSession(buyerId: string): Promise<void> {
  const session = await prisma.buyerSession.create({
    data: {
      id: randomUUID(),
      buyerId,
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  const jar = await cookies();
  jar.set(COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });
}

export async function destroyBuyerSession(): Promise<void> {
  const jar = await cookies();
  const sessionId = jar.get(COOKIE_NAME)?.value;
  if (sessionId) {
    await prisma.buyerSession.deleteMany({ where: { id: sessionId } });
  }
  jar.delete(COOKIE_NAME);
}

export type CurrentBuyer = { id: string; name: string; email: string };

export async function getCurrentBuyer(): Promise<CurrentBuyer | null> {
  const jar = await cookies();
  const sessionId = jar.get(COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await prisma.buyerSession.findUnique({
    where: { id: sessionId },
    include: { buyer: true },
  });
  if (!session || session.expiresAt <= new Date()) return null;

  const { buyer } = session;
  return { id: buyer.id, name: buyer.name, email: buyer.email };
}

export async function requireBuyer(): Promise<CurrentBuyer> {
  const buyer = await getCurrentBuyer();
  if (!buyer) redirect("/cuenta/ingresar");
  return buyer;
}
