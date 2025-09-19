// pages/api/market-prices.js
export default async function handler(req, res) {
  try {
    const { commodity, state, district } = req.query;

    if (!commodity || !state || !district) {
      return res.status(400).json({ error: "commodity, state and district are required" });
    }

    const API_KEY =
      process.env.DATA_GOV_API_KEY ||
      "579b464db66ec23bdd000001cdc3b564546246a772a26393094f5645";
    const API_URL = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${API_KEY}&offset=0&limit=10000&format=json`;

    const r = await fetch(API_URL);
    if (!r.ok) throw new Error(`Data.gov fetch failed: ${r.status}`);
    const json = await r.json();
    const records = json.records || [];

    const norm = (s) => (s || "").toString().trim().toLowerCase();

    const matched = records.filter((rec) => {
      return (
        norm(rec.commodity) === norm(commodity) &&
        norm(rec.state) === norm(state) &&
        norm(rec.district) === norm(district)
      );
    });

    // normalize fields we return (safe field fallbacks)
    const out = matched.map((r) => ({
      market: r.market || r.market_name || r.MARKET || "",
      state: r.state || "",
      district: r.district || "",
      commodity: r.commodity || "",
      variety: r.variety || r.variety_name || "",
      min_price: r.min_price || r.minimum_price || r['min_price'] || "",
      max_price: r.max_price || "",
      modal_price: r.modal_price || r.modal || r['modal_price'] || "",
      arrival_date: r.arrival_date || r['arrival_date'] || r.record_date || r.date || "",
    }));

    res.status(200).json({ records: out, count: out.length });
  } catch (err) {
    console.error("market-prices api error:", err);
    res.status(500).json({ error: "Failed to fetch market prices" });
  }
}
