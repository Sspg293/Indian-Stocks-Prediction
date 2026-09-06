"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Bell, Search, TrendingUp, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Asset = {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  signal?: string;
  score?: number;
  category: string;
  exchange?: string;
};

const demoStocks: Asset[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 1482.60, change: 1.24, signal: "BUY", score: 78, category: "Equity", exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1938.25, change: 1.83, signal: "BUY", score: 81, category: "Equity", exchange: "NSE" },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 4124.10, change: 0.72, signal: "BUY", score: 72, category: "Equity", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys", price: 1512.35, change: -0.36, signal: "HOLD", score: 54, category: "Equity", exchange: "NSE" },
  { symbol: "ICICIBANK", name: "ICICI Bank", price: 1428.90, change: -1.18, signal: "SELL", score: 69, category: "Equity", exchange: "NSE" }
];

const chart = Array.from({ length: 30 }, (_, i) => ({
  t: `${9 + Math.floor((i * 5) / 60)}:${String((15 + i * 5) % 60).padStart(2, "0")}`,
  price: 1464 + i * 0.72 + Math.sin(i / 2.8) * 5 + Math.cos(i / 4) * 2
}));

const categories = ["All", "Equity", "SME", "ETF", "Gold ETF", "Silver ETF", "REIT", "InvIT"];

export default function Home() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("RELIANCE");
  const [category, setCategory] = useState("All");
  const [assets, setAssets] = useState<Asset[]>(demoStocks);
  const [loadingUniverse, setLoadingUniverse] = useState(true);

  useEffect(() => {
    fetch("/api/universe")
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Universe API failed")))
      .then(data => {
        if (Array.isArray(data.assets) && data.assets.length) {
          // Keep any locally supplied quote/prediction fields when the
          // security-master response only contains symbol/name metadata.
          const demoBySymbol = new Map(demoStocks.map(a => [a.symbol, a]));
          const merged = data.assets.map((asset: Asset) => {
            const demo = demoBySymbol.get(asset.symbol);
            return demo
              ? { ...asset, price: asset.price ?? demo.price, change: asset.change ?? demo.change,
                  signal: asset.signal ?? demo.signal, score: asset.score ?? demo.score }
              : asset;
          });
          setAssets(merged);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUniverse(false));
  }, []);

  const stock = assets.find(s => s.symbol === selected) ?? assets[0] ?? demoStocks[0];

  const filtered = useMemo(() => assets.filter(s =>
    (category === "All" || s.category === category) &&
    (`${s.symbol} ${s.name}`.toLowerCase().includes(query.toLowerCase()))
  ), [assets, query, category]);

  return (
    <main className="min-h-screen grid-bg">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b14]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/20 p-2"><Zap size={21} className="text-indigo-300" /></div>
            <div><div className="font-bold tracking-tight">Bharat Markets</div><div className="text-xs text-slate-500">Indian Stock Intelligence</div></div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <span className="text-white">Dashboard</span><span>Predictions</span><span>Watchlist</span><span>Backtest</span>
          </div>
          <button className="rounded-xl border border-white/10 p-2 text-slate-300"><Bell size={18} /></button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-7">
        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm text-emerald-400">● Market dashboard</p>
            <h1 className="text-3xl font-bold md:text-4xl">Indian Market Predictions</h1>
            <p className="mt-2 text-slate-400">Complete NSE security universe with stocks, ETFs, Gold, Silver, REITs and InvITs.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-3 text-slate-500" size={18} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search any Indian security..." className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 outline-none focus:border-indigo-400/50" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[["NIFTY 50","25,184.35","+0.86%"],["BANK NIFTY","57,412.20","+1.12%"],["SENSEX","82,756.44","+0.74%"]].map(([name,value,chg]) =>
            <div className="card p-5" key={name}>
              <div className="flex justify-between text-sm text-slate-400"><span>{name}</span><TrendingUp size={17} className="text-emerald-400" /></div>
              <div className="mt-3 text-2xl font-semibold">{value}</div>
              <div className="mt-1 text-sm text-emerald-400">{chg} today</div>
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_330px]">
          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xs text-slate-500">Selected security</div><h2 className="text-xl font-semibold">{stock.symbol}</h2><div className="text-sm text-slate-400">{stock.name}</div></div>
              <div className="text-right"><div className="text-2xl font-bold">{stock.price ? `₹${stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "Live price pending"}</div><div className={stock.change && stock.change >= 0 ? "text-emerald-400" : "text-rose-400"}>{stock.change != null ? `${stock.change >= 0 ? "+" : ""}${stock.change}%` : "—"}</div></div>
            </div>
            <div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart}><CartesianGrid stroke="rgba(148,163,184,.08)" vertical={false}/><XAxis dataKey="t" hide/><YAxis domain={["dataMin - 5","dataMax + 5"]} width={55} tick={{fill:"#64748b",fontSize:11}}/><Tooltip contentStyle={{background:"#0b1220",border:"1px solid #263247",borderRadius:12}}/><Area type="monotone" dataKey="price" stroke="#818cf8" fill="#818cf8" fillOpacity={.15} strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
          </section>

          <section className="card p-5">
            <div className="flex items-center gap-2 text-slate-300"><Activity size={18}/> AI Prediction</div>
            <div className="mt-5 flex items-center justify-between">
              <div><div className="text-3xl font-bold text-emerald-400">{stock.signal ?? "—"}</div><div className="text-sm text-slate-500">Model signal</div></div>
              <div className="text-right"><div className="text-3xl font-bold">{stock.score ? `${stock.score}%` : "—"}</div><div className="text-xs text-slate-500">confidence</div></div>
            </div>
            <div className="mt-5 rounded-xl bg-white/5 p-4"><div className="flex justify-between text-sm"><span className="text-slate-400">Asset class</span><span>{stock.category}</span></div></div>
            <div className="mt-5 space-y-3 text-sm">
              {["RSI","MACD","20 EMA trend","Volume momentum"].map((x,i)=><div className="flex justify-between border-b border-white/5 pb-3" key={x}><span className="text-slate-400">{x}</span><span className={i===3 ? "text-emerald-400" : "text-slate-200"}>{stock.signal ? ["61.4 Bullish","Bullish crossover","Above EMA","High"][i] : "Connect live data"}</span></div>)}
            </div>
          </section>
        </div>

        <section className="mt-5 card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">Complete Indian Security Universe</h2>
              <p className="text-xs text-slate-500">{loadingUniverse ? "Loading official NSE security files…" : `${filtered.length.toLocaleString("en-IN")} matching securities`}</p>
            </div>
            <div className="flex max-w-full flex-wrap gap-2">{categories.map(x => <button key={x} onClick={() => setCategory(x)} className={`rounded-lg px-3 py-1.5 text-xs ${category === x ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-400"}`}>{x}</button>)}</div>
          </div>
          <div className="grid grid-cols-[1.25fr_.8fr_.7fr_.8fr] gap-3 px-5 py-3 text-[10px] font-bold text-slate-600"><span>SYMBOL / COMPANY</span><span>EXCHANGE</span><span>TYPE</span><span>PRICE</span></div>
          <div className="max-h-[620px] divide-y divide-white/5 overflow-auto">
            {filtered.slice(0, 500).map(s =>
              <button key={`${s.exchange}-${s.symbol}-${s.category}`} onClick={() => setSelected(s.symbol)} className="grid w-full grid-cols-[1.25fr_.8fr_.7fr_.8fr] items-center gap-3 px-5 py-3 text-left hover:bg-white/[.03]">
                <div><div className="font-medium">{s.symbol}</div><div className="truncate text-xs text-slate-500">{s.name}</div></div>
                <div className="text-xs text-slate-400">{s.exchange ?? "NSE"}</div>
                <div className="text-xs text-slate-400">{s.category}</div>
                <div className="text-sm">{s.price ? `₹${s.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}</div>
              </button>
            )}
          </div>
          {filtered.length > 500 && <div className="border-t border-white/10 p-4 text-center text-xs text-slate-500">Showing first 500 matches. Use search/category filters to find any security.</div>}
        </section>

        <footer className="py-8 text-center text-xs text-slate-600">Educational dashboard. Predictions are model outputs, not guaranteed returns or investment advice.</footer>
      </div>
    </main>
  );
}
