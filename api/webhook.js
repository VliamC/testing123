export default async function handler(req, res) {
  const body = req.body || {};

  if (body.challenge) {
    // This is critical: sets header to JSON and sends only the JSON challenge!
    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify({ challenge: body.challenge }));
    return;
  }

  res.status(200).send("OK");
}
