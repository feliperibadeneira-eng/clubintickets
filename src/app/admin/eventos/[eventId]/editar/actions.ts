"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizer } from "@/lib/auth";
import {
  updateEvent,
  setEventStatus,
  createTicketType,
  updateTicketType,
  deleteTicketType,
  createPriceTier,
  updatePriceTier,
  deletePriceTier,
} from "@/lib/eventManagement";

export type FormState = { error: string } | { ok: true } | null;

function revalidate(eventId: string) {
  revalidatePath(`/admin/eventos/${eventId}/editar`);
  revalidatePath(`/admin/eventos/${eventId}`);
  revalidatePath("/admin");
}

export async function updateEventAction(
  eventId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireOrganizer();
  const result = await updateEvent(eventId, user.organizationId, {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    venueId: String(formData.get("venueId") ?? ""),
    startsAtLocal: String(formData.get("startsAt") ?? ""),
    endsAtLocal: String(formData.get("endsAt") ?? ""),
  });
  if (!result.ok) return { error: result.error };
  revalidate(eventId);
  return { ok: true };
}

export async function setStatusAction(
  eventId: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  _prev: FormState,
): Promise<FormState> {
  const user = await requireOrganizer();
  const result = await setEventStatus(eventId, user.organizationId, status);
  if (!result.ok) return { error: result.error };
  revalidate(eventId);
  return { ok: true };
}

export async function createTicketTypeAction(
  eventId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireOrganizer();
  const result = await createTicketType(eventId, user.organizationId, {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    groupSize: Number(formData.get("groupSize") ?? 1),
    totalStock: Number(formData.get("totalStock") ?? 0),
  });
  if (!result.ok) return { error: result.error };
  revalidate(eventId);
  return { ok: true };
}

export async function updateTicketTypeAction(
  eventId: string,
  ticketTypeId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireOrganizer();
  const result = await updateTicketType(ticketTypeId, user.organizationId, {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    groupSize: Number(formData.get("groupSize") ?? 1),
    totalStock: Number(formData.get("totalStock") ?? 0),
  });
  if (!result.ok) return { error: result.error };
  revalidate(eventId);
  return { ok: true };
}

export async function deleteTicketTypeAction(
  eventId: string,
  ticketTypeId: string,
  _prev: FormState,
): Promise<FormState> {
  const user = await requireOrganizer();
  const result = await deleteTicketType(ticketTypeId, user.organizationId);
  if (!result.ok) return { error: result.error };
  revalidate(eventId);
  return { ok: true };
}

export async function createPriceTierAction(
  eventId: string,
  ticketTypeId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireOrganizer();
  const result = await createPriceTier(ticketTypeId, user.organizationId, {
    name: String(formData.get("name") ?? ""),
    price: String(formData.get("price") ?? ""),
    startsAtLocal: String(formData.get("startsAt") ?? ""),
    endsAtLocal: String(formData.get("endsAt") ?? ""),
  });
  if (!result.ok) return { error: result.error };
  revalidate(eventId);
  return { ok: true };
}

export async function updatePriceTierAction(
  eventId: string,
  priceTierId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireOrganizer();
  const result = await updatePriceTier(priceTierId, user.organizationId, {
    name: String(formData.get("name") ?? ""),
    price: String(formData.get("price") ?? ""),
    startsAtLocal: String(formData.get("startsAt") ?? ""),
    endsAtLocal: String(formData.get("endsAt") ?? ""),
  });
  if (!result.ok) return { error: result.error };
  revalidate(eventId);
  return { ok: true };
}

export async function deletePriceTierAction(
  eventId: string,
  priceTierId: string,
  _prev: FormState,
): Promise<FormState> {
  const user = await requireOrganizer();
  const result = await deletePriceTier(priceTierId, user.organizationId);
  if (!result.ok) return { error: result.error };
  revalidate(eventId);
  return { ok: true };
}
