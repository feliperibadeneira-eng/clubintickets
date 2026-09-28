"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, destroySession } from "@/lib/auth";
import { checkInTicket, type CheckInResult } from "@/lib/checkin";

export async function scanTicket(
  scannedText: string,
  eventId: string,
): Promise<CheckInResult | { result: "INVALID"; reason: string }> {
  const user = await getCurrentUser();
  if (!user) return { result: "INVALID", reason: "Tu sesión expiró." };
  return checkInTicket(scannedText, eventId, user.id);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/staff/login");
}
