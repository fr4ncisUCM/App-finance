import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/session";
import { searchSymbols } from "@/lib/market/yahoo";

export async function GET(req: NextRequest) {
  if (!(await readSession())) return NextResponse.json([], { status: 401 });
  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 60) ?? "";
  if (!q) return NextResponse.json([]);
  return NextResponse.json(await searchSymbols(q.toLowerCase()));
}
