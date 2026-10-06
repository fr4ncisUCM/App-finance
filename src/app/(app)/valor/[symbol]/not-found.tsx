import Link from "next/link";
import { Card } from "@/components/ui";

export default function NotFound() {
  return (
    <Card className="mx-auto max-w-lg text-center">
      <h1 className="mb-2 text-xl font-semibold">No encuentro ese valor</h1>
      <p className="mb-4 text-sm text-muted">Puede que el símbolo no exista o que la fuente de datos no responda ahora mismo.</p>
      <Link href="/buscar" className="text-accent">
        Buscar otro valor
      </Link>
    </Card>
  );
}
