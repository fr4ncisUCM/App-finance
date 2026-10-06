import Link from "next/link";
import { ChevronRight, LogOut, Users } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { setBaseCurrency } from "@/app/actions/preferences";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, Card, PageHeader } from "@/components/ui";
import { BASE_CURRENCIES } from "@/lib/currencies";
import { requireUser } from "@/lib/dal";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Ajustes" subtitle={`${user.name} · @${user.username}`} />
      <div className="grid max-w-4xl gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Apariencia</h2>
          <ThemeToggle />
        </Card>

        <Card>
          <h2 className="mb-1 font-semibold">Moneda de la cartera</h2>
          <p className="mb-3 text-sm text-muted">Los totales de «Mis valores» se muestran en esta moneda.</p>
          <form action={setBaseCurrency} className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
            {BASE_CURRENCIES.map((c) => (
              <button
                key={c}
                name="currency"
                value={c}
                className={`h-10 rounded-lg text-sm font-medium ${
                  user.baseCurrency === c ? "bg-surface text-text shadow-sm" : "text-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">Cambiar contraseña</h2>
          <ChangePasswordForm />
        </Card>

        {user.role === "admin" && (
          <Link href="/ajustes/usuarios" className="block">
            <Card className="flex items-center gap-3">
              <Users className="text-accent" size={20} />
              <span className="flex-1 font-semibold">Usuarios</span>
              <ChevronRight className="text-muted" size={20} />
            </Card>
          </Link>
        )}

        <form action={logout}>
          <Button variant="danger" className="w-full">
            <LogOut size={18} /> Cerrar sesión
          </Button>
        </form>
      </div>
    </>
  );
}
