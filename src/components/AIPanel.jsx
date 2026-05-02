import { useState } from "react";
import { T } from "../theme";
import Icon from "./Icon";

const AIPanel = ({ open, onClose }) => {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai",   text: "Bonjour Dr. Benali ! Je suis votre assistant IA médical. Comment puis-je vous aider aujourd'hui ?" },
    { role: "user", text: "Quelle est la posologie habituelle de l'Amlodipine ?" },
    { role: "ai",   text: "L'Amlodipine se prescrit généralement à 5 mg/jour en prise unique le matin. En cas de réponse insuffisante, la dose peut être augmentée à 10 mg/jour. Surveiller : tension artérielle et œdèmes des membres inférieurs." },
  ]);

  const send = () => {
    if (!msg.trim()) return;
    const q = msg.trim();
    setMessages(m => [
      ...m,
      { role: "user", text: q },
      { role: "ai", text: `Je recherche les informations concernant : « ${q} »…` },
    ]);
    setMsg("");
  };

  if (!open) return null;

  return (
    <div style={{
      width: 300, background: T.surface,
      borderLeft: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: "16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg,${T.teal},${T.blue})`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="ai" size={14} color="#000" />
          </div>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, color: T.text }}>
              Assistant IA
            </div>
            <div style={{ fontSize: 10, color: T.teal }}>● En ligne</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted }}>
          <Icon name="close" size={16} color={T.textMuted} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "9px 12px", borderRadius: 10,
              background: m.role === "user"
                ? `linear-gradient(135deg,${T.teal},${T.blue})`
                : T.card,
              border: m.role === "ai" ? `1px solid ${T.border}` : "none",
              fontSize: 12, color: m.role === "user" ? "#000" : T.text,
              lineHeight: 1.55,
            }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      <div style={{ padding: "8px 14px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: `1px solid ${T.border}` }}>
        {["Interactions médicaments", "Posologie pédiatrique", "Effets secondaires"].map(s => (
          <button key={s}
            onClick={() => setMsg(s)}
            style={{ background: T.tealDim, border: `1px solid ${T.borderAccent}`, borderRadius: 20, padding: "3px 10px", color: T.teal, fontSize: 10, cursor: "pointer" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "12px 14px", display: "flex", gap: 8 }}>
        <input
          className="input-base"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Posez une question médicale…"
          style={{ flex: 1 }}
        />
        <button
          onClick={send}
          style={{
            width: 36, height: 36, flexShrink: 0,
            background: `linear-gradient(135deg,${T.teal},${T.blue})`,
            border: "none", borderRadius: 9, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name="send" size={14} color="#000" />
        </button>
      </div>
    </div>
  );
};

export default AIPanel;
