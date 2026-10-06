"use client";

import { useActionState } from "react";
import { setup } from "@/app/actions/auth";
import { Button, FormMessage, Input, Label } from "@/components/ui";

export function SetupForm() {
  const [state, action, pending] = useActionState(setup, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="username">Usuario</Label>
        <Input id="username" name="username" autoCapitalize="none" autoComplete="username" required />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creando…" : "Crear administrador"}
      </Button>
    </form>
  );
}
