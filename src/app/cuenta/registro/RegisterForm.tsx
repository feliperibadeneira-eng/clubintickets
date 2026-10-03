"use client";

import { useActionState } from "react";
import { registerBuyer, type RegisterState } from "./actions";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<
    RegisterState,
    FormData
  >(registerBuyer, null);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
        />
      </div>

      {state?.error && (
        <p className="rounded-xl border border-danger/25 bg-danger-bg p-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creando cuenta…" : "Crear mi cuenta"}
      </Button>
    </form>
  );
}
