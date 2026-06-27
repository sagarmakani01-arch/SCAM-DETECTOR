import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { nexar } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const SAMPLES = [
  "WhatsApp group offering 50% monthly crypto returns",
  "Fake recruiter from 'Amazon HR' asking for ₹5,000 fee",
  "shein.in",
  "EdTech course promising 100% placement",
  "Telegram trading channel with screenshots",
  "Fake government PMKVY scheme website",
  "MetaMask wallet legitimacy",
];

export default function SearchBox({ size = "lg" }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { user } = useAuth();

  const submit = async (override) => {
    const query = (override ?? q).trim();
    if (!query) { toast.error("Type or paste something to analyze"); return; }
    setLoading(true);
    try {
      const report = await nexar.analyze(query);
      if (!user) toast.info("Sign up to save reports to your dashboard");
      nav(`/report/${report.id}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="glass rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 glow-ring focus-within:border-white/30 transition" data-testid="hero-search-wrapper">
        <Search className="h-5 w-5 text-zinc-500 ml-3 shrink-0" />
        <input
          data-testid="hero-search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Paste a URL, UPI ID, WhatsApp group, job offer, app, course…"
          className={`flex-1 bg-transparent outline-none ${size === "lg" ? "h-14 text-base sm:text-lg" : "h-11 text-sm"} placeholder:text-zinc-600 text-white`}
        />
        <button
          data-testid="hero-search-submit"
          disabled={loading}
          onClick={() => submit()}
          className="shrink-0 h-12 px-5 rounded-xl bg-white text-black font-medium text-sm flex items-center gap-2 hover:bg-zinc-200 transition disabled:opacity-60"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing</> : <>Analyze <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button
            key={s}
            onClick={() => { setQ(s); submit(s); }}
            data-testid={`sample-${s.slice(0, 12)}`}
            className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
