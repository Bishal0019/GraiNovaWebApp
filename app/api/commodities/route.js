// api/commodities/route.js
import { NextResponse } from "next/server";

const API_URL =
  "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdc3b564546246a772a26393094f5645&offset=0&limit=all&format=json";

export async function GET() {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to fetch from data.gov.in");
    }

    const data = await res.json();
    
    // ✅ Correct: Return the data directly from the government API
    return NextResponse.json(data);
  } catch (err) {
    console.error("Commodity API error:", err);
    return NextResponse.json({ records: [] }, { status: 500 });
  }
}