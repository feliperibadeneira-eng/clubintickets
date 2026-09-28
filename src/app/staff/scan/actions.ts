"use server";

import { getCurrentUser } from "@/lib/auth";
import { checkInTicket, type CheckInResult } from "@/lib/checkin";

export async function scanTicket(
  scannedText: string,
  eventId: string,
): Promise<CheckInResult | { result: "INVALID"; reason: string }> {
  const user = await getCurrentUser();
  if (!user) return { result: "INVALID", reason: "Tu sesión expiró." };
  return checkInTicket(scannedText, eventId, user.id);
}
