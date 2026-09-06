import { NextResponse } from "next/server";

export async function GET() {
  // Replace this demo response with your licensed NSE/BSE market-data provider.
  return NextResponse.json({
    status: "demo",
    market: "INDIA",
    indices: [
      { symbol: "NIFTY50", value: 25184.35, changePct: 0.86 },
      { symbol: "BANKNIFTY", value: 57412.20, changePct: 1.12 },
      { symbol: "SENSEX", value: 82756.44, changePct: 0.74 }
    ]
  });
}
