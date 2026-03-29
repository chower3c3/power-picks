// Vercel Serverless Function — /api/odds
// This runs on the SERVER, so CORS restrictions don't apply.
// The browser calls /api/odds?sport=basketball_nba&apiKey=xxx
// and this function forwards it to the-odds-api.com and returns the result.

export default async function handler(req, res) {
  // Allow requests from your own site
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { sport, apiKey } = req.query;

  if (!sport || !apiKey) {
    return res.status(400).json({ error: "Missing sport or apiKey parameter" });
  }

  // Validate apiKey is a reasonable length (basic sanity check)
  if (apiKey.length < 10 || apiKey.length > 200) {
    return res.status(400).json({ error: "Invalid API key format" });
  }

  const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&bookmakers=draftkings&oddsFormat=american`;

  try {
    const upstream = await fetch(url);
    const body = await upstream.text();

    // Forward the status code and key headers from upstream
    res.setHeader("Content-Type", "application/json");
    res.setHeader("x-requests-remaining", upstream.headers.get("x-requests-remaining") || "");
    res.setHeader("x-requests-used", upstream.headers.get("x-requests-used") || "");

    return res.status(upstream.status).send(body);
  } catch (err) {
    console.error("Proxy fetch error:", err);
    return res.status(500).json({ error: "Failed to reach odds API", detail: err.message });
  }
}
