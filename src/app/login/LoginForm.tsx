"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    null,
  );

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Contraseña</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-foreground px-6 py-3 font-medium text-background transition enabled:hover:opacity-85 disabled:opacity-40"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
