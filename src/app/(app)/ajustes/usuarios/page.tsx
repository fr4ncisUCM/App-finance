import Link from "next/link";
import { asc } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { deleteUser } from "@/app/actions/users";
import { Button, Card, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/dal";
import { CreateUserForm, ResetPasswordForm } from "./forms";

export const metadata = { title: "Usuarios" };

export default async function UsersPage() {
  const me = await requireAdmin();
  const all = await db
    .select({ id: users.id, name: users.name, username: users.username, role: users.role })
    .from(users)
    .orderBy(asc(users.createdAt));

  return (
    <>
      <Link href="/ajustes" className="mb-2 inline-flex items-center text-sm text-muted">
        <ChevronLeft size={16} /> Ajustes
      </Link>
      <PageHeader title="Usuarios" subtitle="Solo los administradores pueden crear cuentas" />

      <div className="max-w-2xl space-y-3">
        {all.map((u) => (
          <Card key={u.id}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-muted">
                  @{u.username} · {u.role === "admin" ? "Administrador" : "Usuario"}
                </p>
              </div>
              {u.id !== me.id && (
                <form action={deleteUser}>
                  <input type="hidden" name="userId" value={u.id} />
                  <Button variant="danger" className="h-9 px-3 text-xs">
                    Eliminar
                  </Button>
                </form>
              )}
            </div>
            <ResetPasswordForm userId={u.id} />
          </Card>
        ))}

        <Card>
          <h2 className="mb-3 font-semibold">Nuevo usuario</h2>
          <CreateUserForm />
        </Card>
      </div>
    </>
  );
}
