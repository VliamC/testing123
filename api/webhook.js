export default async function handler(req, res) {
  let body = req.body;

  // Parse raw body if not already parsed (Vercel sends it as a string for POST)
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || "");
    } catch {
      body = {};
    }
  }

  if (body.challenge) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify({ challenge: body.challenge }));
    return;
  }

  res.status(200).send("OK");
}
