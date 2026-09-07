import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 20;

type Quote = {
  price: number;
  change: number;
  signal: "BUY" | "HOLD" | "SELL";
  score: number;
  rsi: number;
  macd: number;
  ema20: number;
  volumeMomentum: number;
  next7Days: { day: number; price: number; changePct: number }[];
  updatedAt: string;
};

function yahooSymbol(symbol: string) {
  return `${symbol.trim().toUpperCase()}.NS`;
}

function ema(values: number[], period: number) {
  if (!values.length) return 0;
  const k = 2 / (period + 1);
  let e = values[0];
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}

function rsi(values: number[], period = 14) {
  if (values.length <= period) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const gain = Math.max(d, 0);
    const loss = Math.max(-d, 0);
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function macd(values: number[]) {
  if (values.length < 26) return 0;
  return ema(values, 12) - ema(values, 26);
}

function buildPrediction(closes: number[], volumes: number[], price: number): {
  signal: "BUY" | "HOLD" | "SELL";
  score: number;
  rsi: number;
  macd: number;
  ema20: number;
  volumeMomentum: number;
  next7Days: { day: number; price: number; changePct: number }[];
} {
  const r = rsi(closes);
  const m = macd(closes);
  const e20 = ema(closes, Math.min(20, closes.length));
  const recentVolume = volumes.slice(-5);
  const priorVolume = volumes.slice(-20, -5);
  const recentAvg = recentVolume.length ? recentVolume.reduce((a,b)=>a+b,0)/recentVolume.length : 0;
  const priorAvg = priorVolume.length ? priorVolume.reduce((a,b)=>a+b,0)/priorVolume.length : recentAvg;
  const vm = priorAvg > 0 ? ((recentAvg - priorAvg) / priorAvg) * 100 : 0;

  // Transparent deterministic technical model. This is intentionally not
  // presented as guaranteed or as a trained financial ML model.
  let score = 50;
  if (r >= 55 && r <= 72) score += 15;
  else if (r > 72) score -= 8;
  else if (r < 35) score += 5;
  else if (r < 45) score -= 5;

  if (m > 0) score += 15; else score -= 12;
  if (price >= e20) score += 15; else score -= 12;
  if (vm > 10) score += 5;
  else if (vm < -10) score -= 5;

  score = Math.max(1, Math.min(99, Math.round(score)));
  const signal = score >= 65 ? "BUY" : score <= 40 ? "SELL" : "HOLD";

  // Seven-day directional projection based on recent trend, momentum and
  // the technical score. This is a model estimate, not a guaranteed price.
  const window = closes.slice(-20);
  const n = window.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sx += i; sy += window[i]; sxx += i*i; sxy += i*window[i]; }
  const denom = n*sxx - sx*sx;
  const slope = denom ? (n*sxy - sx*sy) / denom : 0;
  const dailyMomentum = price ? (slope / price) : 0;
  const bias = (score - 50) / 5000;
  const dailyReturn = Math.max(-0.03, Math.min(0.03, dailyMomentum + bias));
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const projected = price * Math.pow(1 + dailyReturn, i + 1);
    return { day: i + 1, price: projected, changePct: ((projected / price) - 1) * 100 };
  });

  return { signal, score, rsi: r, macd: m, ema20: e20, volumeMomentum: vm, next7Days };
}

async function fetchYahoo(symbol: string): Promise<Quote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol(symbol))}?range=3mo&interval=1d&includePrePost=false`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BharatMarkets/1.0)" },
    cache: "no-store"
  });
  if (!res.ok) return null;

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const meta = result?.meta;
  const quote = result?.indicators?.quote?.[0];
  const closes = (quote?.close ?? []).map(Number).filter(Number.isFinite);
  const volumes = (quote?.volume ?? []).map(Number).filter(Number.isFinite);

  const price = Number(meta?.regularMarketPrice ?? closes.at(-1));
  const previous = Number(meta?.previousClose ?? closes.at(-2));
  if (!Number.isFinite(price) || price <= 0 || closes.length < 20) return null;

  const change = Number.isFinite(previous) && previous > 0
    ? ((price - previous) / previous) * 100
    : 0;

  const prediction = buildPrediction(closes, volumes, price);
  return {
    price,
    change,
    ...prediction,
    updatedAt: new Date().toISOString()
  };
}

export async function GET(request: NextRequest) {
  const symbols = Array.from(new Set(
    (request.nextUrl.searchParams.get("symbols") ?? "")
      .split(",")
      .map(s => s.trim().toUpperCase())
      .filter(Boolean)
  )).slice(0, 40);

  if (!symbols.length) return NextResponse.json({ quotes: {} });

  const settled = await Promise.allSettled(
    symbols.map(async symbol => [symbol, await fetchYahoo(symbol)] as const)
  );

  const quotes: Record<string, Quote> = {};
  const errors: string[] = [];

  settled.forEach((item, i) => {
    if (item.status === "fulfilled" && item.value[1]) {
      quotes[item.value[0]] = item.value[1]!;
    } else {
      errors.push(symbols[i]);
    }
  });

  return NextResponse.json(
    {
      provider: "Yahoo Finance fallback + technical prediction model",
      delayed: true,
      quotes,
      errors
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
