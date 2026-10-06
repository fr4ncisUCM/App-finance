import { Star } from "lucide-react";
import { toggleWatch } from "@/app/actions/portfolio";
import { SubmitButton } from "./submit-button";

export function WatchButton({ symbol, name, watched }: { symbol: string; name: string; watched: boolean }) {
  return (
    <form action={toggleWatch}>
      <input type="hidden" name="symbol" value={symbol} />
      <input type="hidden" name="name" value={name} />
      <SubmitButton variant={watched ? "secondary" : "primary"} title={watched ? "Quitar de Mis valores" : "Añadir a Mis valores"}>
        <Star size={16} className={watched ? "fill-current text-amber-500" : ""} />
        {watched ? "En Mis valores" : "Seguir"}
      </SubmitButton>
    </form>
  );
}
