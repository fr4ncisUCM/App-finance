import { formatPrice } from "@/lib/format";

// Catálogo de lo que la app sigue por defecto, con nombres y explicaciones en español.

export type Instrument = { symbol: string; name: string; hint?: string };

export type MarketGroup = {
  id: string;
  title: string;
  short: string;
  /** Qué es este grupo, explicado para alguien que empieza. */
  explainer: string;
  items: Instrument[];
};

export const MARKET_GROUPS: MarketGroup[] = [
  {
    id: "eeuu",
    title: "EE. UU.",
    short: "Índices de Wall Street",
    explainer:
      "Wall Street es el mercado más grande del mundo. Un índice es una «cesta» de empresas que resume cómo va la bolsa: si sube, la mayoría de sus empresas suben. El S&P 500 (las 500 mayores empresas de EE. UU.) es la referencia mundial.",
    items: [
      { symbol: "^GSPC", name: "S&P 500", hint: "Las 500 mayores empresas de EE. UU. Es «el mercado» por excelencia." },
      { symbol: "^IXIC", name: "Nasdaq Composite", hint: "Bolsa con mucho peso tecnológico (Apple, Nvidia, Microsoft…)." },
      { symbol: "^NDX", name: "Nasdaq 100", hint: "Las 100 mayores empresas no financieras del Nasdaq." },
      { symbol: "^DJI", name: "Dow Jones", hint: "30 grandes empresas históricas. El índice más antiguo." },
      { symbol: "^RUT", name: "Russell 2000", hint: "2.000 empresas pequeñas: termómetro de la economía doméstica de EE. UU." },
      { symbol: "^VIX", name: "VIX (índice del miedo)", hint: "Mide el nerviosismo esperado. Por debajo de 15 = calma; por encima de 30 = pánico." },
    ],
  },
  {
    id: "acciones-eeuu",
    title: "Grandes de EE. UU.",
    short: "Las empresas más grandes",
    explainer:
      "Las empresas más valiosas del mundo. Muchas noticias del mercado giran en torno a ellas: cuando presentan resultados, pueden mover todo el índice.",
    items: [
      { symbol: "NVDA", name: "Nvidia" },
      { symbol: "AAPL", name: "Apple" },
      { symbol: "MSFT", name: "Microsoft" },
      { symbol: "GOOGL", name: "Alphabet (Google)" },
      { symbol: "AMZN", name: "Amazon" },
      { symbol: "META", name: "Meta (Facebook)" },
      { symbol: "AVGO", name: "Broadcom" },
      { symbol: "TSLA", name: "Tesla" },
      { symbol: "BRK-B", name: "Berkshire Hathaway" },
      { symbol: "JPM", name: "JPMorgan Chase" },
      { symbol: "LLY", name: "Eli Lilly" },
      { symbol: "V", name: "Visa" },
      { symbol: "WMT", name: "Walmart" },
      { symbol: "XOM", name: "ExxonMobil" },
      { symbol: "NFLX", name: "Netflix" },
      { symbol: "AMD", name: "AMD" },
    ],
  },
  {
    id: "europa",
    title: "Europa",
    short: "Índices europeos",
    explainer:
      "Cada país tiene su índice principal. El Euro Stoxx 50 resume a las 50 mayores empresas de la zona euro; el IBEX 35 es el de España.",
    items: [
      { symbol: "^STOXX50E", name: "Euro Stoxx 50", hint: "Las 50 mayores empresas de la zona euro." },
      { symbol: "^GDAXI", name: "DAX (Alemania)" },
      { symbol: "^FCHI", name: "CAC 40 (Francia)" },
      { symbol: "^FTSE", name: "FTSE 100 (Reino Unido)" },
      { symbol: "^IBEX", name: "IBEX 35 (España)" },
      { symbol: "FTSEMIB.MI", name: "FTSE MIB (Italia)" },
      { symbol: "^AEX", name: "AEX (Países Bajos)" },
      { symbol: "^SSMI", name: "SMI (Suiza)" },
    ],
  },
  {
    id: "mundo",
    title: "Asia y resto",
    short: "Asia, emergentes",
    explainer:
      "Asia abre cuando en Europa es de noche, así que suele marcar el tono con el que empieza el día. China y Japón son las referencias.",
    items: [
      { symbol: "^N225", name: "Nikkei 225 (Japón)" },
      { symbol: "^HSI", name: "Hang Seng (Hong Kong)" },
      { symbol: "000001.SS", name: "Shanghái (China)" },
      { symbol: "^KS11", name: "KOSPI (Corea del Sur)" },
      { symbol: "^BSESN", name: "Sensex (India)" },
      { symbol: "^BVSP", name: "Bovespa (Brasil)" },
      { symbol: "^MXX", name: "IPC (México)" },
      { symbol: "^AXJO", name: "ASX 200 (Australia)" },
    ],
  },
  {
    id: "cripto",
    title: "Cripto",
    short: "Criptomonedas",
    explainer:
      "Activos digitales que cotizan 24 horas, 7 días a la semana. Son mucho más volátiles que las acciones: moverse un 5 % en un día es normal.",
    items: [
      { symbol: "BTC-USD", name: "Bitcoin" },
      { symbol: "ETH-USD", name: "Ethereum" },
      { symbol: "SOL-USD", name: "Solana" },
      { symbol: "XRP-USD", name: "XRP" },
      { symbol: "BNB-USD", name: "BNB" },
      { symbol: "DOGE-USD", name: "Dogecoin" },
      { symbol: "ADA-USD", name: "Cardano" },
    ],
  },
  {
    id: "divisas",
    title: "Divisas",
    short: "Tipos de cambio",
    explainer:
      "Cuánto vale una moneda en otra. EUR/USD = 1,10 significa que 1 euro compra 1,10 dólares. Si sube, el euro se fortalece (y las acciones de EE. UU. te salen más baratas en euros).",
    items: [
      { symbol: "EURUSD=X", name: "Euro / Dólar" },
      { symbol: "EURGBP=X", name: "Euro / Libra" },
      { symbol: "EURJPY=X", name: "Euro / Yen" },
      { symbol: "EURCHF=X", name: "Euro / Franco suizo" },
      { symbol: "JPY=X", name: "Dólar / Yen" },
      { symbol: "DX-Y.NYB", name: "Índice dólar (DXY)", hint: "Fuerza del dólar frente a una cesta de monedas." },
    ],
  },
  {
    id: "materias",
    title: "Materias primas",
    short: "Oro, petróleo…",
    explainer:
      "Productos básicos que se compran y venden en todo el mundo. El oro suele subir cuando hay miedo; el petróleo afecta a la inflación y a la gasolina.",
    items: [
      { symbol: "GC=F", name: "Oro", hint: "Activo «refugio»: suele subir en épocas de incertidumbre." },
      { symbol: "SI=F", name: "Plata" },
      { symbol: "CL=F", name: "Petróleo WTI (EE. UU.)" },
      { symbol: "BZ=F", name: "Petróleo Brent (Europa)" },
      { symbol: "NG=F", name: "Gas natural" },
      { symbol: "HG=F", name: "Cobre", hint: "Muy ligado a la industria: «el doctor cobre» anticipa la economía." },
      { symbol: "ZW=F", name: "Trigo" },
    ],
  },
  {
    id: "bonos",
    title: "Bonos y tipos",
    short: "Rentabilidad de la deuda",
    explainer:
      "Lo que paga un gobierno por pedir dinero prestado (en %). Si los tipos suben, la deuda paga más y las acciones suelen sufrir, sobre todo las tecnológicas.",
    items: [
      { symbol: "^IRX", name: "Letra EE. UU. 3 meses", hint: "Muy ligada a los tipos de interés de la Reserva Federal." },
      { symbol: "^FVX", name: "Bono EE. UU. 5 años" },
      { symbol: "^TNX", name: "Bono EE. UU. 10 años", hint: "El tipo de interés más vigilado del mundo." },
      { symbol: "^TYX", name: "Bono EE. UU. 30 años" },
    ],
  },
];

export const IBEX_35: Instrument[] = [
  ["ACS.MC", "ACS"], ["ACX.MC", "Acerinox"], ["AENA.MC", "Aena"], ["AMS.MC", "Amadeus"], ["ANA.MC", "Acciona"],
  ["ANE.MC", "Acciona Energía"], ["BBVA.MC", "BBVA"], ["BKT.MC", "Bankinter"], ["CABK.MC", "CaixaBank"],
  ["CLNX.MC", "Cellnex"], ["COL.MC", "Colonial"], ["ELE.MC", "Endesa"], ["ENG.MC", "Enagás"], ["FDR.MC", "Fluidra"],
  ["FER.MC", "Ferrovial"], ["GRF.MC", "Grifols"], ["IAG.MC", "IAG (Iberia)"], ["IBE.MC", "Iberdrola"],
  ["IDR.MC", "Indra"], ["ITX.MC", "Inditex"], ["LOG.MC", "Logista"], ["MAP.MC", "Mapfre"], ["MRL.MC", "Merlin"],
  ["MTS.MC", "ArcelorMittal"], ["NTGY.MC", "Naturgy"], ["PUIG.MC", "Puig"], ["RED.MC", "Redeia"], ["REP.MC", "Repsol"],
  ["ROVI.MC", "Rovi"], ["SAB.MC", "Banco Sabadell"], ["SAN.MC", "Banco Santander"], ["SCYR.MC", "Sacyr"],
  ["SLR.MC", "Solaria"], ["TEF.MC", "Telefónica"], ["UNI.MC", "Unicaja"],
].map(([symbol, name]) => ({ symbol, name }));

/** Lo que se ve de un vistazo en la portada. */
export const HEADLINE_SYMBOLS = ["^GSPC", "^IXIC", "^DJI", "^STOXX50E", "^IBEX", "^N225", "BTC-USD", "EURUSD=X", "GC=F", "BZ=F", "^TNX", "^VIX"];

const NAMES = new Map<string, Instrument>(
  [...MARKET_GROUPS.flatMap((g) => g.items), ...IBEX_35].map((i) => [i.symbol, i]),
);

export function knownInstrument(symbol: string) {
  return NAMES.get(symbol);
}

/** Valores cuyo precio es un porcentaje (rentabilidad de bonos) y no un precio. */
export function isYieldSymbol(symbol: string) {
  return ["^IRX", "^FVX", "^TNX", "^TYX"].includes(symbol);
}

/** Precio listo para mostrar: los índices y divisas van sin moneda y los bonos en %. */
export function priceLabel(symbol: string, type: string | null | undefined, price: number | null | undefined, currency: string | null | undefined) {
  if (isYieldSymbol(symbol)) return `${formatPrice(price)} %`;
  if (symbol.startsWith("^") || type === "INDEX" || type === "CURRENCY") return formatPrice(price);
  return formatPrice(price, currency);
}
