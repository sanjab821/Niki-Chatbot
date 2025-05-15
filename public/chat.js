
let lang = "de";
document.addEventListener("DOMContentLoaded", () => {
  const htmlLang = document.documentElement.lang;
  if (["en", "fa"].includes(htmlLang)) lang = htmlLang;
});

const texts = {
  de: {
    title: "Hallo, ich bin Niki – wie kann ich helfen?",
    placeholder: "Nachricht schreiben...",
    you: "Du",
    bot: "Niki",
    error: "Verbindung zum Server fehlgeschlagen.",
    dir: "ltr"
  },
  en: {
    title: "Hi, I'm Niki – how can I help?",
    placeholder: "Type your message...",
    you: "You",
    bot: "Niki",
    error: "Failed to reach server.",
    dir: "ltr"
  },
  fa: {
    title: "سلام، من نیکی هستم – چطور می‌تونم کمک کنم؟",
    placeholder: "پیامت رو بنویس...",
    you: "شما",
    bot: "نیکی",
    error: "اتصال به سرور انجام نشد.",
    dir: "rtl"
  }
};

const t = texts[lang];

document.getElementById("chat-header").textContent = t.title;
document.getElementById("userInput").placeholder = t.placeholder;
document.getElementById("chat-box").dir = t.dir;
document.getElementById("userInput").dir = t.dir;

document.getElementById("chat-toggle").addEventListener("click", () => {
  document.getElementById("chat-widget").classList.toggle("hidden");
});

document.getElementById("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;
  input.value = "";

  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML += `<p><strong>${t.you}:</strong> ${message}</p>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, lang })
    });
    const data = await res.json();
    chatBox.innerHTML += `<p><strong>${t.bot}:</strong> ${data.reply}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (err) {
    chatBox.innerHTML += `<p><strong>${t.bot}:</strong> ${t.error}</p>`;
  }
});
