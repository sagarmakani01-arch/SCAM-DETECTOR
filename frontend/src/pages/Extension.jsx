import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Chrome, Shield, Zap, Globe, ArrowRight, Sparkles } from "lucide-react";
import Nav from "@/components/Nav";

export default function Extension() {
  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <Nav />
      <div className="aurora opacity-50" />
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <main className="relative pt-32 pb-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-zinc-300 mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
              Chrome extension — Coming this quarter
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-light tracking-tighter leading-[0.95] text-gradient">
              Nexar in every<br />browser tab.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-zinc-400 leading-relaxed">
              One-click verdicts on whatever you're looking at — Amazon listing, recruiter email, sketchy crypto site, Telegram link. Right-click → Nexar → instant Trust score.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button data-testid="join-waitlist-btn" disabled
                className="inline-flex items-center h-12 px-6 rounded-full bg-white text-black font-medium opacity-90">
                <Chrome className="h-4 w-4 mr-2" /> Join waitlist <span className="ml-3 text-[10px] uppercase tracking-widest text-zinc-500">soon</span>
              </button>
              <Link to="/" className="inline-flex items-center h-12 px-6 rounded-full border border-white/15 hover:bg-white/5 text-sm" data-testid="extension-back-btn">
                Back to web app <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="relative">
            <div className="glass rounded-3xl p-6 glow-ring">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <div className="flex-1 ml-3 glass rounded-md px-3 py-1.5 text-xs text-zinc-400">amazon.in/sketchy-crypto-...</div>
              </div>
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs uppercase tracking-widest text-zinc-400">Nexar verdict</span>
                </div>
                <div className="font-display text-2xl font-bold tracking-tight">High-risk crypto airdrop</div>
                <p className="text-sm text-zinc-400 mt-2">Anonymous team, unaudited contract, MLM-style referral. Avoid.</p>
                <div className="mt-4 flex gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-emerald-400 border border-emerald-400/30 px-2 py-1 rounded-full">Trust 12</span>
                  <span className="text-[10px] uppercase tracking-widest text-amber-400 border border-amber-400/30 px-2 py-1 rounded-full">Risk 94</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-5">
          {[
            { icon: Shield, t: "Right-click to scan", d: "Highlight any text or right-click any link to get an instant Nexar verdict overlay." },
            { icon: Zap, t: "Real-time URL safety", d: "Browser shows a green / amber / red badge in the address bar based on Nexar's trust score." },
            { icon: Globe, t: "Auto-flag fake stores", d: "Dropshipping fronts, fake Amazon clones and phishing sites are flagged before the page loads." },
          ].map((f) => (
            <div key={f.t} className="glass rounded-3xl p-7">
              <f.icon className="h-5 w-5 text-emerald-400 mb-4" />
              <h3 className="font-display text-xl font-bold tracking-tight">{f.t}</h3>
              <p className="text-sm text-zinc-400 mt-3 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
