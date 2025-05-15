const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const fs = require("fs");
const cors = require("cors");
const { OpenAI } = require("openai");

dotenv.config();
const app = express();
const port = 3000;

// GPT API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔓 CORS aktivieren
app.use(cors({
  origin: ["http://127.0.0.1:5500", "https://deine-webseite.de"] // ← hier deine Domain eintragen
}));

app.use(bodyParser.json());
app.use(express.static("public"));

// 🧠 System Prompt
const systemPrompt = `
You are Niki, a helpful, professional designer at Sam Saket Studio. 
Always answer in the same language as the user: German, English, or Persian.

- Be short, friendly, natural – like a real person.
- Ask for name, email, and a short description of their request.
- Thank them once you receive their email and say "someone from our team will contact you soon".
- Never answer in a different language.
- Never mention you're AI.
- If needed, share: info@samsaketstudio.com.
`;

// 📧 E-Mail Setup
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

// 📩 Haupt-Chat-Endpunkt
app.post("/chat", async (req, res) => {
  const { message, lang } = req.body;

  try {
    const userMessage = lang ? `LANGUAGE: ${lang}\n${message}` : message;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const reply = completion.choices[0].message.content;

    // 📜 Loggen
    const log = `[${new Date().toISOString()}]\nLANG: ${lang}\nUSER: ${message}\nNIKI: ${reply}\n\n`;
    fs.appendFile("messages.log", log, (err) => {
      if (err) console.error("Fehler beim Loggen:", err);
    });

    // 📧 Bei E-Mail-Adresse
    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,}/gi;
    if (emailRegex.test(message)) {
      sendEmailToYou(`Neue Nachricht:\n${message}\n\nAntwort von Niki:\n${reply}`);
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
