"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowUpRight, BarChart3, Bell, Search, TrendingDown, TrendingUp, Zap } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const stocks = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 1482.60, change: 1.24, signal: "BUY", score: 78 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1938.25, change: 1.83, signal: "BUY", score: 81 },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 4124.10, change: 0.72, signal: "BUY", score: 72 },
  { symbol: "INFY", name: "Infosys", price: 1512.35, change: -0.36, signal: "HOLD", score: 54 },
  { symbol: "ICICIBANK", name: "ICICI Bank", price: 1428.90, change: -1.18, signal: "SELL", score: 69 }
];

const chart = Array.from({length: 30}, (_, i) => ({
  t: `${9 + Math.floor((i*5)/60)}:${String((15 + i*5)%60).padStart(2,"0")}`,
  price: 1464 + i * 0.72 + Math.sin(i/2.8)*5 + Math.cos(i/4)*2
}));

export default function Home() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("RELIANCE");
  const [category, setCategory] = useState("All");
  const stock = universe.find(s => s.symbol === selected) ?? universe[0];
  const filtered = useMemo(() => universe.filter(s =>
    (category === "All" || s.category === category) &&
    (s.symbol + s.name).toLowerCase().includes(query.toLowerCase())
  ), [query, category]);

  return (
    <main className="min-h-screen grid-bg">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b14]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/20 p-2"><Zap size={21} className="text-indigo-300"/></div>
            <div><div className="font-bold tracking-tight">Bharat Markets</div><div className="text-xs text-slate-500">Indian Stock Intelligence</div></div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <span className="text-white">Dashboard</span><span>Predictions</span><span>Watchlist</span><span>Backtest</span>
          </div>
          <button className="rounded-xl border border-white/10 p-2 text-slate-300"><Bell size={18}/></button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-7">
        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="mb-2 text-sm text-emerald-400">● Market dashboard</p><h1 className="text-3xl font-bold md:text-4xl">Indian Market Predictions</h1><p className="mt-2 text-slate-400">Technical signals, market momentum and model-based outlook.</p></div>
          <div className="relative w-full md:w-72"><Search className="absolute left-3 top-3 text-slate-500" size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search NSE stock..." className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 outline-none focus:border-indigo-400/50"/></div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["NIFTY 50","25,184.35","+0.86%"],["BANK NIFTY","57,412.20","+1.12%"],["SENSEX","82,756.44","+0.74%"]
          ].map(([name,value,chg])=><div className="card p-5" key={name}><div className="flex justify-between text-sm text-slate-400"><span>{name}</span><TrendingUp size={17} className="text-emerald-400"/></div><div className="mt-3 text-2xl font-semibold">{value}</div><div className="mt-1 text-sm text-emerald-400">{chg} today</div></div>)}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_330px]">
          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xs text-slate-500">Selected stock</div><h2 className="text-xl font-semibold">{stock.symbol}</h2><div className="text-sm text-slate-400">{stock.name}</div></div>
              <div className="text-right"><div className="text-2xl font-bold">₹{stock.price.toLocaleString("en-IN", {minimumFractionDigits:2})}</div><div className={stock.change >= 0 ? "text-emerald-400" : "text-rose-400"}>{stock.change >= 0 ? "+" : ""}{stock.change}%</div></div>
            </div>
            <div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart}><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity={.35}/><stop offset="100%" stopColor="#818cf8" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="rgba(148,163,184,.08)" vertical={false}/><XAxis dataKey="t" hide/><YAxis domain={["dataMin - 5","dataMax + 5"]} width={55} tick={{fill:"#64748b",fontSize:11}}/><Tooltip contentStyle={{background:"#0b1220",border:"1px solid #263247",borderRadius:12}}/><Area type="monotone" dataKey="price" stroke="#818cf8" fill="url(#fill)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
          </section>

          <section className="card p-5">
            <div className="flex items-center gap-2 text-slate-300"><Activity size={18}/> AI Prediction</div>
            <div className="mt-5 flex items-center justify-between"><div><div className="text-3xl font-bold text-emerald-400">{stock.signal}</div><div className="text-sm text-slate-500">Model signal</div></div><div className="text-right"><div className="text-3xl font-bold">{stock.score}%</div><div className="text-xs text-slate-500">confidence</div></div></div>
            <div className="mt-5 rounded-xl bg-white/5 p-4"><div className="flex justify-between text-sm"><span className="text-slate-400">Next-day range</span><span>₹1,475 — ₹1,510</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-[78%] rounded-full bg-indigo-400"/></div></div>
            <div className="mt-5 space-y-3 text-sm">
              {["RSI","MACD","20 EMA trend","Volume momentum"].map((x,i)=><div className="flex justify-between border-b border-white/5 pb-3" key={x}><span className="text-slate-400">{x}</span><span className={i===3?"text-emerald-400":"text-slate-200"}>{["61.4 Bullish","Bullish crossover","Above EMA","High"][i]}</span></div>)}
            </div>
          </section>
        </div>

        <section className="mt-5 card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
            <div><h2 className="font-semibold">Stocks, Gold & Silver ETFs</h2><p className="text-xs text-slate-500">The production version will load the complete NSE/BSE security master from your market-data provider.</p></div>
            <div className="flex flex-wrap gap-2">{sectors.map(x=><button key={x} onClick={()=>setCategory(x)} className={`rounded-lg px-3 py-1.5 text-xs ${category===x?"bg-indigo-500 text-white":"bg-white/5 text-slate-400"}`}>{x}</button>)}</div>
          </div>
          <div className="divide-y divide-white/5">
            {filtered.map(s=><button key={s.symbol} onClick={()=>setSelected(s.symbol)} className="grid w-full grid-cols-[1.2fr_.8fr_.7fr_.8fr] items-center gap-3 px-5 py-4 text-left hover:bg-white/[.03]">
              <div><div className="font-medium">{s.symbol}</div><div className="text-xs text-slate-500">{s.name} · {s.category}</div></div>
              <div>₹{s.price.toLocaleString("en-IN", {minimumFractionDigits:2})}</div>
              <div className={s.change>=0?"text-emerald-400":"text-rose-400"}>{s.change>=0?"+":""}{s.change}%</div>
              <div className={s.signal==="BUY"?"text-emerald-400":s.signal==="SELL"?"text-rose-400":"text-amber-400"}>{s.signal} · {s.score}%</div>
            </button>)}
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-slate-600">Educational dashboard. Predictions are model outputs, not guaranteed returns or investment advice.</footer>
      </div>
    </main>
  );
}
