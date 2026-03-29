// Vercel Serverless Function — /api/odds
// API key is stored in Vercel environment variable ODDS_API_KEY
// Never exposed to the browser

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { sport } = req.query;
  if (!sport) return res.status(400).json({ error: "Missing sport parameter" });

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: "ODDS_API_KEY environment variable not set in Vercel. Go to Vercel → Project Settings → Environment Variables and add it." 
    });
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
    return res.status(upstream.status).send(body);
  } catch (err) {
    return res.status(500).json({ error: "Proxy failed: " + err.message });
  }
};
