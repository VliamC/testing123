// If you use node-fetch, import it at the top:
// import fetch from 'node-fetch'; // Not needed if using Node.js 18+ (native fetch)

export default async function handler(req, res) {
  let body = req.body;
  if (!body || typeof body === "string") {
    try { body = JSON.parse(body || ""); } catch { body = {}; }
  }

  // 1. Handle Lark verification challenge
  if (body.challenge) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify({ challenge: body.challenge }));
    return;
  }

  // 2. Handle message event
  if (
    body.event &&
    body.event.message &&
    body.event.message.content &&
    body.event.message.message_type === 'text'
  ) {
    const userMessage = JSON.parse(body.event.message.content).text;
    const chat_id = body.event.message.chat_id;

    // 3. Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: userMessage }
        ]
      })
    }).then(r => r.json());

    const chatReply = openaiResponse.choices?.[0]?.message?.content || "Sorry, I didn't get that.";

    // 4. Get tenant_access_token from Lark
    const tokenRes = await fetch("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: process.env.APP_ID,
        app_secret: process.env.APP_SECRET
      })
    }).then(r => r.json());
    const tenantToken = tokenRes.tenant_access_token;

    // 5. Send reply to Lark
    const larkRes = await fetch("https://open.larksuite.com/open-apis/im/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tenantToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        receive_id_type: "chat_id",
        receive_id: chat_id,
        content: JSON.stringify({ text: chatReply }),
        msg_type: "text"
      })
    }).then(r => r.json());

    // Log for debugging
    console.log("Lark send message response:", larkRes);

    res.status(200).send("OK");
    return;
  }

  res.status(200).send("OK");
}
