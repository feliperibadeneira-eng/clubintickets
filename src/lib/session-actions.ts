"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth";

// Compartido entre /staff/scan y /admin: cualquier rol puede cerrar sesión
// de la misma forma.
export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
