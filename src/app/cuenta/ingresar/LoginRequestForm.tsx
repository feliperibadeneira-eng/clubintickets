"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { requestBuyerLogin, type RequestLoginState } from "./actions";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginRequestForm() {
  const [state, formAction, pending] = useActionState<
    RequestLoginState,
    FormData
  >(requestBuyerLogin, null);

  if (state?.sent) {
    return (
      <div className="mt-6 rounded-xl border border-success/25 bg-success-bg p-4 text-sm text-success">
        <p className="inline-flex items-center gap-1.5 font-medium">
          <Mail size={15} />
          Revisá tu correo
        </p>
        <p className="mt-1 text-success/80">
          Te mandamos un link para entrar. Vale por 30 minutos.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@email.com"
        />
      </div>
      <div>
        <Label htmlFor="name">Nombre (si es tu primera vez)</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Tu nombre completo"
        />
      </div>

      {state?.sent === false && (
        <p className="rounded-xl border border-danger/25 bg-danger-bg p-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando…" : "Mandarme el link"}
      </Button>
    </form>
  );
}
