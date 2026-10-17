"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Link
            href="/login/recuperar"
            className="mb-1.5 text-xs text-accent hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      {state?.error && (
        <p className="rounded-xl border border-danger/25 bg-danger-bg p-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
