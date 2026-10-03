"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireBuyer, destroyBuyerSession } from "@/lib/buyerAuth";

export type UpdateProfileState = { error: string } | { ok: true } | null;

export async function updateBuyerProfile(
  _prev: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const buyer = await requireBuyer();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 3) return { error: "Escribí tu nombre completo." };

  await prisma.buyer.update({ where: { id: buyer.id }, data: { name } });
  return { ok: true };
}

export async function buyerLogout(): Promise<void> {
  await destroyBuyerSession();
  redirect("/cuenta/ingresar");
}
