import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { aiNotes } from "@/db/schema";

// Textos explicativos generados con Claude. Es opcional: solo funciona si existe ANTHROPIC_API_KEY.
// Cada texto se guarda en la BD para no pagar dos veces por lo mismo.

const MODEL = "claude-sonnet-5-5";

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

/** Error con un mensaje en español que se puede enseñar tal cual al usuario. */
export class AiError extends Error {}

function apiMessage(err: InstanceType<typeof Anthropic.APIError>) {
  const body = err.error as { error?: { message?: string } } | undefined;
  return body?.error?.message ?? err.message;
}

/** Traduce los errores de la API a algo que se entienda y diga cómo arreglarlo. */
function explainError(err: unknown): string {
  if (err instanceof AiError) return err.message;
  if (err instanceof Anthropic.AuthenticationError) {
    return "La API key no es válida. Revisa ANTHROPIC_API_KEY en Vercel (cópiala entera, sin espacios) y vuelve a desplegar.";
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return `La API key no tiene permiso para usar este modelo: ${apiMessage(err)}`;
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "Se ha alcanzado el límite de peticiones de tu cuenta de Anthropic. Espera un minuto y vuelve a probar.";
  }
  if (err instanceof Anthropic.BadRequestError) {
    const msg = apiMessage(err);
    if (/credit balance/i.test(msg)) {
      return "Tu cuenta de Anthropic no tiene créditos. Añádelos en console.anthropic.com → Billing.";
    }
    return `La API de Anthropic ha rechazado la petición: ${msg}`;
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return "No se ha podido conectar con Anthropic. Inténtalo de nuevo en un momento.";
  }
  if (err instanceof Anthropic.APIError) {
    return `Anthropic no está disponible ahora mismo (error ${err.status}). Inténtalo de nuevo en unos minutos.`;
  }
  return "No se ha podido generar el texto. Inténtalo de nuevo en unos minutos.";
}

function readText(response: { stop_reason: string | null; content: { type: string; text?: string }[] }) {
  if (response.stop_reason === "refusal") throw new AiError("La IA no ha querido generar este texto. Prueba más tarde.");
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n")
    .trim();
  if (!text) throw new AiError("La IA ha devuelto una respuesta vacía. Prueba otra vez.");
  return text;
}

async function generate(system: string, prompt: string) {
  // Esfuerzo bajo: para resúmenes basta, responde antes y gasta menos.
  const base = {
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" as const },
    output_config: { effort: "low" as const },
    system,
    messages: [{ role: "user" as const, content: prompt }],
  };
  const client = new Anthropic();
  try {
    // Si el modelo rechaza la petición, la API la reintenta sola con el modelo de respaldo recomendado.
    const response = await client.beta.messages.create({
      ...base,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    return readText(response);
  } catch (err) {
    // Algunas cuentas no tienen activada la función de respaldo: se repite la petición sin ella.
    if (err instanceof Anthropic.BadRequestError && !/credit balance/i.test(apiMessage(err))) {
      console.warn("Reintentando sin respaldo de modelo:", apiMessage(err));
      try {
        return readText(await client.messages.create(base));
      } catch (retryErr) {
        console.error("Error de la API de Anthropic", retryErr);
        throw new AiError(explainError(retryErr));
      }
    }
    console.error("Error de la API de Anthropic", err);
    throw new AiError(explainError(err));
  }
}

/** Petición mínima para comprobar que la clave y los créditos funcionan (Ajustes → Diagnóstico). */
export async function pingAi() {
  const client = new Anthropic();
  try {
    const r = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: "Responde solo: OK" }],
    });
    return `Funciona (${r.model})`;
  } catch (err) {
    throw new AiError(explainError(err));
  }
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
