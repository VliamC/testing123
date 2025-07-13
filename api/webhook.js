export default async function handler(req, res) {
  let body = req.body;
  if (!body || typeof body === "string") {
    try { body = JSON.parse(body || ""); } catch { body = {}; }
  }

  // 1. Lark verification challenge handler
  if (body.challenge) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify({ challenge: body.challenge }));
    return;
  }

  // 2. Lark message event handler
  if (
    body.event &&
    body.event.message &&
    body.event.message.content &&
    body.event.message.message_type === 'text'
  ) {
    let userMessage;
    try {
      userMessage = JSON.parse(body.event.message.content).text;
    } catch {
      userMessage = "Sorry, couldn't parse your message!";
    }
    const chat_id = body.event.message.chat_id;

    // 3. Get tenant_access_token from Lark
    const tokenRes = await fetch("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: process.env.APP_ID,
        app_secret: process.env.APP_SECRET
      })
    }).then(r => r.json());
    const tenantToken = tokenRes.tenant_access_token;

    // Log the full tenant token response and value
    console.log("Lark tenant token response:", JSON.stringify(tokenRes, null, 2));
    console.log("Tenant token used:", tenantToken);

    // 4. Call OpenAI ChatGPT API
    let chatReply = "Sorry, I didn't get that.";
    try {
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant for Lark users." },
            { role: "user", content: userMessage }
          ]
        })
      }).then(r => r.json());
      chatReply = openaiResponse.choices?.[0]?.message?.content || chatReply;
    } catch {}

    // 5. Build the payload and send reply to Lark
    const larkPayload = {
      receive_id_type: "chat_id",
      receive_id: chat_id,
      msg_type: "text",
      content: JSON.stringify({ text: chatReply })
    };

    // Log payload for debugging
    console.log("Lark payload:", JSON.stringify(larkPayload, null, 2));

    const larkRes = await fetch("https://open.larksuite.com/open-apis/im/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tenantToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(larkPayload)
    }).then(r => r.json());

    // Log full response for debugging
    console.log("Lark send message response:", JSON.stringify(larkRes, null, 2));

    res.status(200).send("OK");
    return;
  }

  res.status(200).send("OK");
}
