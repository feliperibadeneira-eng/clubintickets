"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizer } from "@/lib/auth";
import { refundOrder } from "@/lib/orders";

export type RefundState = { error: string } | { ok: true } | null;

export async function refundOrderAction(
  eventId: string,
  orderId: string,
  _prev: RefundState,
): Promise<RefundState> {
  const user = await requireOrganizer();
  const result = await refundOrder(orderId, user.organizationId);
  if (!result.ok) return { error: result.error };
  revalidatePath(`/admin/eventos/${eventId}`);
  return { ok: true };
}
