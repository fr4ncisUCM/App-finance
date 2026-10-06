"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button, FormMessage, Input, Label } from "@/components/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="username">Usuario</Label>
        <Input
          id="username"
          name="username"
          defaultValue={state?.username}
          autoComplete="username"
          autoCapitalize="none"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
