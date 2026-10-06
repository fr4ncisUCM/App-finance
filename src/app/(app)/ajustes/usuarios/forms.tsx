"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUser, resetPassword } from "@/app/actions/users";
import { Button, FormMessage, Input, Label, Select } from "@/components/ui";

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUser, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div>
        <Label htmlFor="new-name">Nombre</Label>
        <Input id="new-name" name="name" required />
      </div>
      <div>
        <Label htmlFor="new-username">Usuario</Label>
        <Input id="new-username" name="username" autoCapitalize="none" autoComplete="off" required />
      </div>
      <div>
        <Label htmlFor="new-password">Contraseña</Label>
        <Input id="new-password" name="password" type="text" autoComplete="off" minLength={6} required />
      </div>
      <div>
        <Label htmlFor="new-role">Rol</Label>
        <Select id="new-role" name="role" defaultValue="user">
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </Select>
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        Crear usuario
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ userId }: { userId: number }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex gap-2">
        <Input name="password" type="text" placeholder="Nueva contraseña" autoComplete="off" minLength={6} required />
        <Button type="submit" variant="secondary" disabled={pending} className="shrink-0">
          Restablecer
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
