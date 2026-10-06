# Pulso 📈

App web para seguir los mercados cada día y entender lo que pasa, pensada para quien empieza.

- **Hoy**: resumen del día (con IA, opcional), índices clave, lo que más sube y baja, tus valores y los últimos titulares.
- **Mercados**: EE. UU., grandes empresas, Europa, Asia, cripto, divisas, materias primas, bonos e IBEX 35, cada grupo explicado.
- **Lo que se mueve**: las acciones que más suben, bajan y se negocian.
- **Ficha de cada valor**: gráfico interactivo (1 día a todo el histórico), rentabilidades, datos clave con explicación de cada término, opinión de analistas, próximos resultados, noticias y «Explícamelo fácil» (IA).
- **Noticias**: Expansión, Cinco Días, Investing, MarketWatch, BBC, CoinDesk y Google Noticias.
- **Mis valores**: lista de seguimiento y cartera (registra tus compras y ve cuánto ganas o pierdes, convertido a tu moneda).
- **Aprender**: guías cortas y glosario.

**Stack**: Next.js 16 · TypeScript · Tailwind CSS 4 · Drizzle ORM · PostgreSQL (Neon) · Vercel.
Datos de mercado gratuitos de Yahoo Finance (sin API key). Resúmenes con Claude (Anthropic), opcional.

## Desplegar en Vercel (una sola vez)

1. En [vercel.com](https://vercel.com) → **Add New… → Project** → importa este repositorio de GitHub.
   No cambies nada de la configuración de build.
2. En el proyecto → **Storage → Create Database → Neon (Postgres)** → conéctala al proyecto (todos los entornos).
   Esto crea la variable `DATABASE_URL` automáticamente.
3. En **Settings → Environment Variables** añade:
   - `SESSION_SECRET`: un valor aleatorio largo (por ejemplo, el resultado de `openssl rand -base64 32`).
   - `ANTHROPIC_API_KEY` *(opcional)*: activa el «Resumen del día» y «Explícamelo fácil». Se crea en
     [console.anthropic.com](https://console.anthropic.com). Cada texto se guarda en la base de datos, así que solo
     se paga cuando pulsas el botón (como mucho una vez cada 20 minutos para el resumen y una vez al día por empresa).
4. **Deployments → Redeploy**. Las migraciones de la base de datos se aplican solas en cada build.
5. Abre la URL: la primera vez te pedirá crear la cuenta de **administrador**.
   Desde **Ajustes → Usuarios** creas las cuentas del resto.

## Desarrollo local

```bash
cp .env.example .env.local      # ajusta DATABASE_URL y SESSION_SECRET
npm install
npm run db:migrate
npm run dev                     # http://localhost:3000
```

| Script | Qué hace |
|---|---|
| `npm run db:generate` | Genera una migración SQL tras cambiar `src/db/schema.ts` |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run lint` / `npm run typecheck` | Comprobaciones |
| `npm run icons` | Regenera los iconos de la app |

## Dónde está cada cosa

- `src/lib/market/catalog.ts`: qué índices, divisas, materias primas… se siguen y sus explicaciones. Añade o quita símbolos aquí.
- `src/lib/market/yahoo.ts`: cotizaciones, gráficos, fichas, buscador y «lo que se mueve» (con caché).
- `src/lib/market/news.ts`: fuentes RSS de noticias.
- `src/lib/ai.ts`: textos generados con IA.
- `src/data/learn.ts`: guías y glosario.

> Pulso es una herramienta informativa. No es asesoramiento financiero.
