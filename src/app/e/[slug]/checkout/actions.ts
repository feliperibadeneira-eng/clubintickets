"use server";

import { redirect } from "next/navigation";
import { createOrder, type SelectionInput } from "@/lib/orders";

export type CheckoutFormState = { error: string } | null;

export async function submitOrder(
  eventSlug: string,
  selections: SelectionInput[],
  _prev: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const buyerName = String(formData.get("buyerName") ?? "");
  const buyerEmail = String(formData.get("buyerEmail") ?? "");
  if (buyerName.trim().length < 3) return { error: "Escribe tu nombre." };
  if (!/^\S+@\S+\.\S+$/.test(buyerEmail.trim()))
    return { error: "El email no parece válido." };

  // Los datos de cada asistente llegan como attendee-<ticketTypeId>-<n>-name / -id
  const withAttendees = selections.map((sel) => ({
    ...sel,
    attendees: sel.attendees.map((_, i) => ({
      fullName: String(
        formData.get(`attendee-${sel.ticketTypeId}-${i}-name`) ?? "",
      ),
      idNumber: String(
        formData.get(`attendee-${sel.ticketTypeId}-${i}-id`) ?? "",
      ),
    })),
  }));

  const result = await createOrder({
    eventSlug,
    buyerName,
    buyerEmail,
    selections: withAttendees,
  });

  if (!result.ok) return { error: result.error };
  redirect(`/orden/${result.orderId}`);
}
