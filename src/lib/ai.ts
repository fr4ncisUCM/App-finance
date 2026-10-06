import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { aiNotes } from "@/db/schema";

// Textos explicativos generados con Claude. Es opcional: solo funciona si existe ANTHROPIC_API_KEY.
// Cada texto se guarda en la BD para no pagar dos veces por lo mismo.

const MODEL = "claude-opus-5-5";

export function aiEnabled() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function readNote(key: string) {
  const [note] = await db.select().from(aiNotes).where(eq(aiNotes.key, key));
  return note ?? null;
}

async function saveNote(key: string, content: string) {
  await db
    .insert(aiNotes)
    .values({ key, content })
    .onConflictDoUpdate({ target: aiNotes.key, set: { content, createdAt: new Date() } });
}

const STYLE = `Escribes en español de España para una persona que está empezando a seguir los mercados y no tiene formación financiera.
- Explica la jerga la primera vez que aparezca (entre paréntesis y en pocas palabras).
- Sé concreto: cita cifras de los datos que te dan (con coma decimal, p. ej. «+1,2 %»), no inventes ninguna.
- Si los datos no explican por qué algo se ha movido, dilo; no especules como si fuera un hecho.
- No des recomendaciones de compra o venta ni digas qué hacer con el dinero.
- Formato: Markdown sencillo. Solo títulos «## », listas con «- » y **negritas**. Nada de tablas ni enlaces.`;

async function generate(system: string, prompt: string) {
  const client = new Anthropic();
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    // Si el modelo rechaza la petición, la API la reintenta sola con el modelo de respaldo recomendado.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error("La IA no ha podido generar el texto.");
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("La IA ha devuelto una respuesta vacía.");
  return text;
}

export function briefKey(userId: number, day: string) {
  return `brief:${day}:${userId}`;
}

/** Resumen del día en lenguaje sencillo a partir de cotizaciones y titulares reales. */
export async function generateBrief(key: string, data: { date: string; markets: string; movers: string; watchlist: string; news: string }) {
  const prompt = `Hoy es ${data.date}. Prepárame el resumen del día de los mercados.

<mercados>
${data.markets}
</mercados>

<acciones_eeuu_que_mas_se_mueven>
${data.movers}
</acciones_eeuu_que_mas_se_mueven>

<mis_valores_vigilados>
${data.watchlist || "(No sigo ningún valor todavía)"}
</mis_valores_vigilados>

<titulares_recientes>
${data.news}
</titulares_recientes>

Estructura:
## En 30 segundos
Tres o cuatro frases con lo más importante del día.
## Qué está pasando
Los 3-5 temas que mueven el mercado, cada uno en una viñeta con su explicación sencilla y por qué importa.
## Tus valores
Cómo van mis valores vigilados y si alguno aparece en las noticias. Omite esta sección si no sigo ninguno.
## Qué vigilar
Dos o tres cosas a seguir en los próximos días (datos, resultados, eventos) que se mencionen en los titulares.
## Palabra del día
Un concepto financiero que haya salido hoy, explicado en dos frases.

Prioriza EE. UU., después Europa y el resto del mundo, y luego cripto, divisas y materias primas.`;
  const text = await generate(STYLE, prompt);
  await saveNote(key, text);
  return text;
}

export function companyKey(symbol: string, day: string) {
  return `company:${symbol}:${day}`;
}

/** «Explícamelo fácil»: qué hace la empresa y cómo leer sus números. */
export async function generateCompanyExplainer(key: string, data: { name: string; facts: string; news: string }) {
  const prompt = `Explícame «${data.name}» como si fuera la primera vez que miro esta inversión.

<datos>
${data.facts}
</datos>

<titulares_recientes>
${data.news || "(sin titulares)"}
</titulares_recientes>

Estructura:
## Qué es
A qué se dedica y cómo gana dinero, en dos o tres frases.
## Sus números, traducidos
Las 4-6 métricas más relevantes de los datos, cada una con qué significa y si es alta o baja en términos generales.
## Qué se dice ahora
Lo que cuentan los titulares recientes, si los hay.
## Riesgos a tener en cuenta
Dos o tres riesgos típicos de este tipo de inversión.`;
  const text = await generate(STYLE, prompt);
  await saveNote(key, text);
  return text;
}
