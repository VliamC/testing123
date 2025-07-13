export default async function handler(req, res) {
  const body = req.body || {};

  // Lark verification challenge
  if (body.challenge) {
    res.status(200).json({ challenge: body.challenge });
    return;
  }

  // ... You can add more logic here for ChatGPT replies

  res.status(200).send("OK");
}
