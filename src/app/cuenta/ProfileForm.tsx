"use client";

import { useActionState } from "react";
import { updateBuyerProfile, type UpdateProfileState } from "./actions";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ProfileForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState<
    UpdateProfileState,
    FormData
  >(updateBuyerProfile, null);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required defaultValue={name} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
      </div>

      {state && "error" in state && (
        <p className="rounded-xl border border-danger/25 bg-danger-bg p-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state && "ok" in state && (
        <p className="rounded-xl border border-success/25 bg-success-bg p-3 text-sm text-success">
          Guardado.
        </p>
      )}

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
