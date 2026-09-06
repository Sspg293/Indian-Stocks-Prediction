import { NextResponse } from "next/server";

/*
 Production hook:
 Replace this demo response with your licensed provider's security-master endpoint.
 Return every currently tradable NSE/BSE equity and ETF, including Gold/Silver ETFs.
 Keep the security master server-side and cache it; refresh it at least daily.
*/
export async function GET() {
  return NextResponse.json({
    status: "demo",
    categories: ["Equity", "Gold ETF", "Silver ETF"],
    source: process.env.MARKET_DATA_BASE_URL || null,
    message: "Connect a licensed market-data provider to load the complete live universe."
  });
}
