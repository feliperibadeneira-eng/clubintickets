"use server";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { findOrBackfillBuyer } from "@/lib/buyers";
import { sendBuyerLoginEmail } from "@/lib/email";

const TOKEN_MINUTES = 30;

export type RequestLoginState = { sent: true } | { sent: false; error: string } | null;

// Siempre devuelve el mismo resultado exista o no el email, para no darle
// pistas a quien intenta adivinar qué direcciones tienen cuenta.
export async function requestBuyerLogin(
  _prev: RequestLoginState,
  formData: FormData,
): Promise<RequestLoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { sent: false, error: "Escribí tu email." };

  const buyer = await findOrBackfillBuyer(email);
  if (buyer) {
    const token = await prisma.buyerLoginToken.create({
      data: {
        id: randomUUID(),
        buyerId: buyer.id,
        expiresAt: new Date(Date.now() + TOKEN_MINUTES * 60_000),
      },
    });
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    await sendBuyerLoginEmail(
      buyer.email,
      buyer.name,
      `${base}/cuenta/verificar/${token.id}`,
    );
  }

  return { sent: true };
}
