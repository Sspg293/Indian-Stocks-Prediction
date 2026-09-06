import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

type Quote = { price: number; change: number; updatedAt: string };

function yahooSymbol(symbol: string) {
  // NSE symbols are represented by .NS in Yahoo Finance. This route is a
  // fallback quote source; for production-grade real-time data, replace it
  // with a licensed broker/data-provider endpoint.
  return `${symbol.trim().toUpperCase()}.NS`;
}

async function fetchYahoo(symbol: string): Promise<Quote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol(symbol))}?range=1d&interval=1m&includePrePost=false`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BharatMarkets/1.0)" },
    cache: "no-store"
  });
  if (!res.ok) return null;
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const meta = result?.meta;
  const price = Number(meta?.regularMarketPrice ?? meta?.chartPreviousClose);
  const previous = Number(meta?.previousClose ?? meta?.chartPreviousClose);
  if (!Number.isFinite(price) || price <= 0) return null;
  const change = Number.isFinite(previous) && previous > 0 ? ((price - previous) / previous) * 100 : 0;
  return { price, change, updatedAt: new Date().toISOString() };
}

export async function GET(request: NextRequest) {
  const symbols = Array.from(new Set(
    (request.nextUrl.searchParams.get("symbols") ?? "")
      .split(",")
      .map(s => s.trim().toUpperCase())
      .filter(Boolean)
  )).slice(0, 40);

  if (!symbols.length) return NextResponse.json({ quotes: {} });

  const settled = await Promise.allSettled(symbols.map(async symbol => [symbol, await fetchYahoo(symbol)] as const));
  const quotes: Record<string, Quote> = {};
  const errors: string[] = [];

  for (let i = 0; i < settled.length; i++) {
    const item = settled[i];
    if (item.status === "fulfilled" && item.value[1]) {
      quotes[item.value[0]] = item.value[1]!;
    } else {
      errors.push(symbols[i]);
    }
  }

  return NextResponse.json(
    { provider: "Yahoo Finance fallback", delayed: true, quotes, errors },
    { headers: { "Cache-Control": "no-store" } }
  );
}
