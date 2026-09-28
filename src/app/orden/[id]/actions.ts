"use server";

import { revalidatePath } from "next/cache";
import { confirmTestPayment } from "@/lib/orders";

export type TestPaymentState = { error: string } | null;

// Ver la nota en src/lib/orders.ts: esto reemplaza temporalmente al webhook
// de PayPhone hasta que tengamos el RUC para integrarlo de verdad.
export async function submitTestPayment(
  orderId: string,
  _prev: TestPaymentState,
): Promise<TestPaymentState> {
  const result = await confirmTestPayment(orderId);
  if (!result.ok) return { error: result.error };
  revalidatePath(`/orden/${orderId}`);
  return null;
}
