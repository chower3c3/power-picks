// Vercel Serverless Function — /api/odds
// CommonJS format required for Vercel Node.js serverless functions
// Runs server-side so CORS from the-odds-api.com does not apply

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { sport, apiKey } = req.query;

  if (!sport || !apiKey) {
    return res.status(400).json({ error: "Missing sport or apiKey" });
  }

  if (apiKey.length < 10 || apiKey.length > 200) {
    return res.status(400).json({ error: "Invalid API key format" });
  }

  const url =
    "https://api.the-odds-api.com/v4/sports/" +
    encodeURIComponent(sport) +
    "/odds/?apiKey=" + apiKey +
    "&regions=us&markets=h2h,spreads,totals&bookmakers=draftkings&oddsFormat=american";

  try {
    const upstream = await fetch(url);
    const body = await upstream.text();

    res.setHeader("Content-Type", "application/json");

    const remaining = upstream.headers.get("x-requests-remaining");
    if (remaining) res.setHeader("x-requests-remaining", remaining);

    const used = upstream.headers.get("x-requests-used");
    if (used) res.setHeader("x-requests-used", used);

    return res.status(upstream.status).send(body);
  } catch (err) {
    console.error("Proxy error:", err.message);
    return res.status(500).json({ error: "Proxy failed", detail: err.message });
  }
};
