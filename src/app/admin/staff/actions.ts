"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizer } from "@/lib/auth";
import {
  createStaffAccount,
  setStaffActive,
  resetStaffPassword,
} from "@/lib/staffManagement";

export type CreateStaffState =
  | { error: string }
  | { ok: true; email: string; password: string }
  | null;

export async function createStaffAction(
  _prev: CreateStaffState,
  formData: FormData,
): Promise<CreateStaffState> {
  const user = await requireOrganizer();
  const result = await createStaffAccount(user.organizationId, {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin/staff");
  return { ok: true, email: result.data.email, password: result.data.password };
}

export type SimpleState = { error: string } | { ok: true } | null;

export async function setStaffActiveAction(
  userId: string,
  active: boolean,
  _prev: SimpleState,
): Promise<SimpleState> {
  const user = await requireOrganizer();
  const result = await setStaffActive(userId, user.organizationId, active);
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin/staff");
  return { ok: true };
}

export type ResetPasswordState =
  | { error: string }
  | { ok: true; password: string }
  | null;

export async function resetPasswordAction(
  userId: string,
  _prev: ResetPasswordState,
): Promise<ResetPasswordState> {
  const user = await requireOrganizer();
  const result = await resetStaffPassword(userId, user.organizationId);
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin/staff");
  return { ok: true, password: result.data.password };
}
