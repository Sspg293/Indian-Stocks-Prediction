import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Asset = {
  symbol: string;
  name: string;
  category: string;
  exchange: string;
};

const SOURCES = [
  { url: "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv", category: "Equity" },
  { url: "https://nsearchives.nseindia.com/emerge/corporates/content/SME_EQUITY_L.csv", category: "SME" },
  { url: "https://nsearchives.nseindia.com/content/equities/eq_etfseclist.csv", category: "ETF" },
  { url: "https://nsearchives.nseindia.com/content/equities/INVITS_L.csv", category: "InvIT" },
  { url: "https://nsearchives.nseindia.com/content/equities/REITS_L.csv", category: "REIT" }
];

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && quoted && n === '"') { field += '"'; i++; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (c === "," && !quoted) { row.push(field.trim()); field = ""; continue; }
    if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && n === "\n") i++;
      row.push(field.trim()); field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
      continue;
    }
    field += c;
  }
  if (field || row.length) { row.push(field.trim()); if (row.some(Boolean)) rows.push(row); }
  return rows;
}

function clean(value: string | undefined) {
  return (value ?? "").replace(/^\uFEFF/, "").trim();
}

function classifyETF(name: string, symbol: string) {
  const text = `${name} ${symbol}`.toLowerCase();
  if (/(gold|gld|gldbees)/.test(text)) return "Gold ETF";
  if (/(silver|slvr)/.test(text)) return "Silver ETF";
  return "ETF";
}

function rowsToAssets(rows: string[][], fallbackCategory: string): Asset[] {
  if (!rows.length) return [];
  const header = rows[0].map(x => clean(x).toUpperCase().replace(/[^A-Z0-9]/g, ""));
  const find = (...names: string[]) => names.map(n => header.indexOf(n)).find(i => i >= 0) ?? -1;
  const sym = find("SYMBOL", "SYMBOLCODE", "SCRIPCODE");
  const name = find("NAMEOFCOMPANY", "COMPANYNAME", "NAME");
  const out: Asset[] = [];
  for (const r of rows.slice(1)) {
    const symbol = clean(sym >= 0 ? r[sym] : r[0]);
    const company = clean(name >= 0 ? r[name] : r[1] || symbol);
    if (!symbol || symbol.toUpperCase() === "SYMBOL") continue;
    const category = fallbackCategory === "ETF" ? classifyETF(company, symbol) : fallbackCategory;
    out.push({ symbol, name: company || symbol, category, exchange: "NSE" });
  }
  return out;
}

export async function GET() {
  const results = await Promise.allSettled(
    SOURCES.map(async source => {
      const res = await fetch(source.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BharatMarkets/1.0)" },
        cache: "no-store"
      });
      if (!res.ok) throw new Error(`NSE source ${res.status}`);
      return rowsToAssets(parseCSV(await res.text()), source.category);
    })
  );

  const assets = results.flatMap(r => r.status === "fulfilled" ? r.value : []);
  const unique = Array.from(
    new Map(assets.map(a => [`${a.category}:${a.symbol}`, a])).values()
  ).sort((a, b) => a.symbol.localeCompare(b.symbol));

  return NextResponse.json(
    {
      source: "NSE official security files",
      updatedAt: new Date().toISOString(),
      count: unique.length,
      assets: unique
    },
    { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
