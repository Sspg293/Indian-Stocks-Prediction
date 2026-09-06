# Bharat Markets — Indian Stock Prediction Dashboard

A Vercel-ready Next.js starter for an Indian stock-market intelligence dashboard.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## GitHub

```bash
git init
git add .
git commit -m "Initial dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Vercel

Import the GitHub repository into Vercel. No special build configuration is required.

Add environment variables in Vercel when you connect a real market-data provider:

- `MARKET_DATA_API_KEY`
- `MARKET_DATA_BASE_URL`

## Important

The dashboard currently uses clearly marked demo values. It does NOT claim to provide live NSE/BSE prices yet.

For production, connect a licensed/reliable market-data source and implement:
- live/streaming quotes
- historical OHLCV
- technical indicators
- model inference
- prediction logging
- backtesting and accuracy metrics
- rate limiting and caching

Do not commit API keys to GitHub.

## Asset coverage

The UI now has filters for **All, Equity, Gold ETF and Silver ETF**, with Gold BeES/Silver BeES examples included. NSE publishes an ETF market-data section and a securities-available-for-trading list; the production app should synchronize those instruments through a licensed data provider rather than hard-code a static list.

For "all stocks", use the provider's current security master so new listings, delistings, symbol changes and corporate actions are reflected automatically.

## Complete universe implementation

`app/api/universe/route.ts` now reads the official NSE security files server-side:
- Equity
- SME
- ETF
- REIT
- InvIT

Gold and Silver ETFs are automatically classified from the ETF security name/symbol. The browser calls `/api/universe`, so thousands of securities are not hard-coded into the frontend. NSE's official securities page links these CSV files. The site should still use a licensed provider for live quotes and prediction inputs.

## Quote loading fix

The frontend now keeps security-master data separate from quotes. It automatically requests quotes for the first 40 matching securities and the selected symbol, refreshes the selected quote every 30 seconds, and provides a **Load live prices** button for up to 100 visible securities.

`/api/quotes` currently uses Yahoo Finance's public chart endpoint as a fallback. This may be delayed, rate-limited, or unavailable from Vercel and is not a substitute for a licensed real-time NSE/BSE feed. For genuine real-time production data, replace that route with a licensed broker/data-provider API.
