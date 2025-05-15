const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const fs = require("fs");
const cors = require("cors");
const { OpenAI } = require("openai");
const path = require("path");

dotenv.config();
const app = express();
const port = 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CORS aktivieren für lokal + deine Website
app.use(cors({
  origin: ["http://127.0.0.1:5500", "https://samsaketstudio.com"]
}));

app.use(bodyParser.json());
app.use(express.static("public"));

// System Prompt
const systemPrompt = `
You are Niki, a friendly, real designer at Sam Saket Studio.

— Always reply in the same language the user uses: German, English or Persian.
— Be warm and professional, not robotic or repetitive.
— Briefly introduce yourself if it's the first message.
— Ask once: name, email, and what they need (logo, design, etc).
— Stop asking if they gave email.
— Say: someone from *our team* will contact them soon.
— Never mention you're AI.
— Never answer in another language than the one used.
— Share email only if needed: info@samsaketstudio.com.
— Be short and helpful like a human, not long paragraphs.
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
    const langIntro = lang ? `Please answer in this language: ${lang}\n` : "";
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${langIntro}${message}` },
      ],
    });

    const reply = completion.choices[0].message.content;

    const log = `[${new Date().toISOString()}]\nLANG: ${lang}\nUSER: ${message}\nNIKI: ${reply}\n\n`;
    fs.appendFile("messages.log", log, (err) => {
      if (err) console.error("Logfehler:", err);
    });

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
