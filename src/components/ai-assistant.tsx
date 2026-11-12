"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, Send } from "lucide-react";
import { useLanguage } from "./language";

const translations = {
  id: {
    eyebrow: "ASISTEN PROFIL", title: "Kenali", accent: "saya lebih dekat.", description: "Tanya tentang profil, keahlian, proyek, pendidikan, atau kolaborasi Muhammad Faizal.", welcome: "Halo! Saya asisten AI portofolio Faizal. Apa yang ingin Anda ketahui?", note: "Hanya pertanyaan ringan tentang Faizal, bukan untuk membuat kode atau tugas umum. Maks. 400 karakter; 3 pertanyaan/menit dan 20/hari per IP, kuota bersama 200/hari. Jawaban AI bisa keliru. Pertanyaan dikirim ke penyedia AI ThirtyStore; jangan sertakan data pribadi.", placeholder: "Tanyakan sesuatu tentang Faizal...", send: "Kirim pertanyaan", thinking: "Menyiapkan jawaban...", you: "Anda", assistant: "Asisten AI", unavailable: "Asisten AI belum tersedia. Coba lagi nanti.", limited: "Batas penggunaan tercapai. Coba lagi nanti.", scope: "Saya hanya membantu pertanyaan ringan tentang profil Faizal, bukan membuat kode atau mengerjakan tugas lain.", invalid: "Masukkan pertanyaan sepanjang 1–400 karakter.", forbidden: "Permintaan tidak diizinkan. Muat ulang website.", suggestions: ["Siapa Muhammad Faizal?", "Apa keahlian Faizal?", "Proyek apa yang dibuat Faizal?", "Bagaimana menghubungi Faizal?"],
  },
  en: {
    eyebrow: "PROFILE ASSISTANT", title: "Get to", accent: "know me.", description: "Ask about Muhammad Faizal's profile, skills, projects, education, or collaboration.", welcome: "Hi! I'm Faizal's portfolio AI assistant. What would you like to know?", note: "Light questions about Faizal only, not coding or general tasks. Max. 400 characters; 3 questions/minute and 20/day per IP, shared quota 200/day. AI answers may be inaccurate. Questions are sent to AI provider ThirtyStore; do not include personal data.", placeholder: "Ask something about Faizal...", send: "Send question", thinking: "Preparing an answer...", you: "You", assistant: "AI Assistant", unavailable: "The AI assistant is unavailable. Please try again later.", limited: "Usage limit reached. Please try again later.", scope: "I only answer light questions about Faizal's profile, not coding requests or other tasks.", invalid: "Enter a question between 1 and 400 characters.", forbidden: "Request not allowed. Please reload the website.", suggestions: ["Who is Muhammad Faizal?", "What are Faizal's skills?", "What projects has Faizal built?", "How can I contact Faizal?"],
  },
};
type ErrorCode = "unavailable" | "limited" | "scope" | "invalid" | "forbidden";
type Message = { role: "user" | "assistant"; text: string };

export default function AiAssistant() {
  const language = useLanguage();
  const c = translations[language];
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);
  const pending = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [messages, busy]);

  async function ask(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (pending.current || !text) return;
    pending.current = true;
    setBusy(true); setError(null);
    setMessages((previous) => [...previous.slice(-18), { role: "user", text }]);
    setQuestion("");
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text, language }), signal: AbortSignal.timeout(30000) });
      const result = await response.json() as { answer?: string; error?: string };
      if (!response.ok || typeof result.answer !== "string") {
        const code = result.error;
        setError(code === "limited" || code === "scope" || code === "invalid" || code === "forbidden" ? code : "unavailable");
        return;
      }
      setMessages((previous) => [...previous, { role: "assistant", text: result.answer! }]);
    } catch { setError("unavailable"); }
    finally { pending.current = false; setBusy(false); }
  }

  return <div className="panel-inner section-panel ai-panel">
    <div className="section-head animate-in"><p className="kicker"><span className="kicker-line" />09 / {c.eyebrow}</p><h1>{c.title} <em>{c.accent}</em></h1><p className="section-description">{c.description}</p></div>
    <div className="ai-shell animate-in">
      <div className="ai-header"><Bot size={21} /><strong>{c.assistant}</strong><span>Sonnet 5.5</span></div>
      <div className="ai-messages" role="log" aria-label={c.assistant} aria-live="polite" aria-busy={busy}>
        <div className="ai-message"><strong>{c.assistant}</strong><p>{c.welcome}</p></div>
        {messages.map((message, index) => <div className={`ai-message ${message.role === "user" ? "ai-message-user" : ""}`} key={index}><strong>{message.role === "user" ? c.you : c.assistant}</strong><p>{message.text}</p></div>)}
        {busy && <p className="ai-thinking">{c.thinking}</p>}<div ref={endRef} />
      </div>
      <div className="ai-suggestions">{c.suggestions.map((suggestion) => <button key={suggestion} type="button" disabled={busy} onClick={() => setQuestion(suggestion)}>{suggestion}</button>)}</div>
      <form className="chat-compose" onSubmit={ask}><input aria-label={c.placeholder} placeholder={c.placeholder} value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={400} required disabled={busy} /><button type="submit" disabled={busy || !question.trim()} aria-label={c.send}><Send size={18} /></button></form>
    </div>
    <p className="chat-status" role="status">{error ? c[error] : `${question.length}/400`}</p>
  </div>;
}
