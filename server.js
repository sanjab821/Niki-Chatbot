
const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const fs = require("fs");
const { OpenAI } = require("openai");
const path = require("path");

dotenv.config();

const app = express();
const port = 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(bodyParser.json());
app.use(express.static("public"));

const systemPrompt = `
You are Niki, a warm, professional designer and team member at Sam Saket Studio.

Your job is:
- Be friendly, short, and respond naturally – like a real person.
- Respond in the same language the user used (German, English, or Persian).
- Briefly introduce yourself if the user is new.
- Ask for name, email, and a short project description.
- If the user gives their email, say thank you and say "someone from our team will contact you soon".
- Don't ask twice. Don’t overdo formality. Avoid long texts.
- If needed, give: info@samsaketstudio.com.
- Never mention you are AI. Never respond in a different language.

Keep responses helpful and human. Speak clearly and avoid long blocks of text.
`;

const transporter = nodemailer.createTransport({
  service: "yahoo",
  auth: {
    user: process.env.YAHOO_EMAIL,
    pass: process.env.YAHOO_APP_PASSWORD,
  },
});

function sendEmailToYou(content) {
  const mailOptions = {
    from: process.env.YAHOO_EMAIL,
    to: process.env.YAHOO_EMAIL,
    subject: "📬 Neue Nachricht von Niki",
    text: content,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("E-Mail-Fehler:", error);
    else console.log("E-Mail gesendet:", info.response);
  });
}

app.post("/chat", async (req, res) => {
  const { message, lang } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;

    const log = `[${new Date().toISOString()}]
USER: ${message}
NIKI: ${reply}

`;
    fs.appendFile("messages.log", log, (err) => {
      if (err) console.error("Logfehler:", err);
    });

    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,}/gi;
    if (emailRegex.test(message)) {
      sendEmailToYou(`Neue Nachricht:
${message}

Antwort von Niki:
${reply}`);
    }

    res.json({ reply });
  } catch (err) {
    console.error("OpenAI-Fehler:", err);
    res.status(500).json({ error: "Antwortfehler" });
  }
});

app.listen(port, () => {
  console.log(`✅ Niki läuft auf http://localhost:${port}`);
});
