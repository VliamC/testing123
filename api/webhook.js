export default async function handler(req, res) {
  let body = req.body;

  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || "");
    } catch {
      body = {};
    }
  }

  // Log the body to Vercel function logs (go to Vercel > Functions > logs)
  console.log('Received body:', body);

  if (body.challenge) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify({ challenge: body.challenge }));
    return;
  }

  res.status(200).send("OK");
}
