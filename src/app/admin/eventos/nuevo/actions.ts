"use server";

import { redirect } from "next/navigation";
import { requireOrganizer } from "@/lib/auth";
import { createEvent, createVenue } from "@/lib/eventManagement";

export type NewEventState = { error: string } | null;

export async function createEventAction(
  _prev: NewEventState,
  formData: FormData,
): Promise<NewEventState> {
  const user = await requireOrganizer();

  const venueMode = String(formData.get("venueMode") ?? "existing");
  let venueId = String(formData.get("venueId") ?? "");

  if (venueMode === "new") {
    const venueResult = await createVenue(user.organizationId, {
      name: String(formData.get("newVenueName") ?? ""),
      address: String(formData.get("newVenueAddress") ?? ""),
      city: String(formData.get("newVenueCity") ?? ""),
    });
    if (!venueResult.ok) return { error: venueResult.error };
    venueId = venueResult.data.id;
  }

  const result = await createEvent(user.organizationId, {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    venueId,
    startsAtLocal: String(formData.get("startsAt") ?? ""),
    endsAtLocal: String(formData.get("endsAt") ?? ""),
  });
  if (!result.ok) return { error: result.error };

  redirect(`/admin/eventos/${result.data.id}/editar?nuevo=1`);
}
