import { useState } from "react";
import { MessageSquare, X, Send, Loader2, Sparkles } from "lucide-react";
import { nexar } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function ChatDrawer({ reportContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: reportContext ? `Hey — I have full context on "${reportContext}". Ask me anything about it.` : "Hi, I'm your Nexar AI assistant. Ask me to vet anything." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const { user } = useAuth();

  const send = async () => {
    if (!input.trim()) return;
    if (!user) { toast.info("Sign in to use the assistant"); return; }
    const text = input.trim();
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await nexar.chat(text, session);
      setSession(res.session_id);
      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
    } catch (e) {
      toast.error("Assistant unavailable");
    } finally { setLoading(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} data-testid="chat-open-btn"
        className="fixed bottom-24 right-6 z-40 h-14 w-14 rounded-full bg-white text-black shadow-2xl grid place-items-center hover:scale-105 transition">
        <MessageSquare className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" data-testid="chat-drawer">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:w-[420px] h-full glass border-l border-white/10 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-display font-bold tracking-tight">Nexar Assistant</span>
              </div>
              <button onClick={() => setOpen(false)} data-testid="chat-close-btn"><X className="h-4 w-4 text-zinc-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "ml-auto bg-white text-black" : "bg-white/5 text-zinc-200 border border-white/5"}`}>
                  {m.text}
                </div>
              ))}
              {loading && <div className="text-xs text-zinc-500 flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Thinking…</div>}
            </div>
            <div className="p-4 border-t border-white/5 flex gap-2">
              <input data-testid="chat-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask anything…" className="flex-1 h-11 px-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30 text-sm" />
              <button onClick={send} disabled={loading} data-testid="chat-send-btn"
                className="h-11 w-11 rounded-xl bg-white text-black grid place-items-center hover:bg-zinc-200 disabled:opacity-60">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
