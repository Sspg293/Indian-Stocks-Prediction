import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get("symbols")?.split(",").filter(Boolean) ?? [];
  return NextResponse.json({
    status: "provider_required",
    symbols,
    quotes: [],
    message: "Connect a licensed live market-data provider here. Do not use the security-master endpoint as a quote feed."
  });
}
