import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Zap, Brain, Globe, Briefcase, ShoppingBag, Smartphone,
  GraduationCap, Coins, Building2, Sparkles, Check, ArrowRight, Lock, Eye, BarChart3, MessageSquare,
} from "lucide-react";
import Nav from "@/components/Nav";
import SearchBox from "@/components/SearchBox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { nexar } from "@/lib/api";

const CATEGORIES = [
  { icon: ShoppingBag, label: "Products" }, { icon: Globe, label: "Websites" },
  { icon: Smartphone, label: "Mobile Apps" }, { icon: Zap, label: "SaaS Tools" },
  { icon: Building2, label: "Companies" }, { icon: ShoppingBag, label: "Online Stores" },
  { icon: Briefcase, label: "Job Offers" }, { icon: Brain, label: "Freelancers" },
  { icon: Building2, label: "Agencies" }, { icon: GraduationCap, label: "Courses" },
  { icon: Coins, label: "Investments" }, { icon: Coins, label: "Crypto Projects" },
];

const FEATURES = [
  { icon: ShieldCheck, title: "Trust Score 0-100", body: "A precise quantitative signal blending reputation, complaints, and behavioural risk." },
  { icon: Eye, title: "Scam & Fake Review Detection", body: "Spot AI-generated reviews, ghost companies, fake jobs and dropshipping fronts." },
  { icon: BarChart3, title: "Hidden Cost Surfacing", body: "Forecasts subscription creep, fees, warranty gotchas and lock-in traps." },
  { icon: Brain, title: "Better Alternatives", body: "Always returns 3+ ranked alternatives so you never settle for the first option." },
  { icon: MessageSquare, title: "AI Chat Assistant", body: "Live decision support — ask follow-ups, compare two options, get verdicts." },
  { icon: Lock, title: "URL & QR Safety", body: "Domain reputation, certificate signals and clone-site detection in one pass." },
];

const TESTIMONIALS = [
  { name: "Amelia Chen", role: "Investor, Singapore", img: "https://images.pexels.com/photos/12396627/pexels-photo-12396627.jpeg",
    body: "Nexar flagged a fake DeFi project that three Discord groups were shilling. Saved me $14k in a single afternoon." },
  { name: "Marcus Reid", role: "Engineering Manager", img: "https://images.pexels.com/photos/17685845/pexels-photo-17685845.jpeg",
    body: "I run every recruiter pitch through Nexar now. The job-offer breakdown is brutally honest and shockingly accurate." },
];

const TIERS = [
  { name: "Free", price: "₹0", desc: "For curious decision-makers", features: ["10 AI analyses / month", "Basic Trust + Risk scores", "Search history", "Community reviews"] },
  { name: "Pro", price: "₹399", highlight: true, desc: "For power buyers & researchers",
    features: ["Unlimited AI analyses", "Deep multi-pass reasoning", "URL + UPI + QR safety scans", "WhatsApp instant share", "Priority chat assistant"] },
  { name: "Business", price: "₹1,499", desc: "Teams, agencies, procurement",
    features: ["Everything in Pro", "API access", "Browser extension", "Team workspaces", "Hindi + regional language reports"] },
];

const FAQS = [
  { q: "What can I paste into Nexar?", a: "Anything: a product name, a website URL, a company, a job description, an app, an investment pitch, even screenshots of suspicious emails." },
  { q: "How accurate is the Trust Score?", a: "Trust scores are produced by Claude Sonnet 4.5 using a 12-signal rubric. They are advisory, not financial advice — but they routinely catch what humans miss." },
  { q: "Is my search history private?", a: "Yes. Reports are stored encrypted, scoped to your account. Pro plan adds zero-retention chat sessions." },
  { q: "Do you have a browser extension?", a: "Yes — included in Business and rolling out to Pro members in beta." },
  { q: "Can I cancel anytime?", a: "Anytime, no questions. Pro and Business are month-to-month." },
];

export default function Landing() {
  const [stats, setStats] = useState({ total_reports: 12834, total_users: 4127, scams_flagged: 893 });

  useEffect(() => { nexar.stats().then(setStats).catch(() => {}); }, []);

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <Nav />

      {/* HERO */}
      <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32">
        <div className="aurora" />
        <div className="absolute inset-0 grid-bg pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
              className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-zinc-300 mb-6">
                <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
                AI Decision Engine — Live in 38 countries
              </div>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-light tracking-tighter leading-[0.95] text-gradient">
                Know before<br />you decide.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-zinc-400 leading-relaxed">
                Nexar interrogates products, websites, companies, jobs and investments with multi-pass AI — surfacing scams, hidden costs and the exact alternatives you should buy instead.
              </p>
              <div className="mt-8 max-w-2xl">
                <SearchBox />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }}
              className="lg:col-span-5 flex justify-center items-center">
              <div className="relative">
                <div className="orb" />
                <div className="absolute -top-2 -left-4 glass rounded-xl px-3 py-2 text-xs">
                  <div className="text-emerald-400 font-bold">Trust 94</div>
                  <div className="text-zinc-500">tesla.com</div>
                </div>
                <div className="absolute top-1/3 -right-6 glass rounded-xl px-3 py-2 text-xs">
                  <div className="text-amber-400 font-bold">Risk 71</div>
                  <div className="text-zinc-500">crypto-airdrop.io</div>
                </div>
                <div className="absolute -bottom-3 left-8 glass rounded-xl px-3 py-2 text-xs">
                  <div className="text-white font-bold">Value 88</div>
                  <div className="text-zinc-500">Sony WH-1000XM5</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { k: "Reports generated", v: stats.total_reports?.toLocaleString() },
              { k: "Scams flagged", v: stats.scams_flagged?.toLocaleString() },
              { k: "Decision-makers", v: stats.total_users?.toLocaleString() },
              { k: "Categories analysed", v: "13+" },
            ].map((s) => (
              <div key={s.k} className="glass rounded-2xl p-6">
                <div className="font-display text-3xl sm:text-4xl font-bold tracking-tighter">{s.v}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mt-2">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logo marquee */}
      <section className="py-10 border-y border-white/5 overflow-hidden">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-zinc-600 mb-6">Decision-makers trust Nexar</p>
        <div className="marquee whitespace-nowrap text-zinc-500 text-2xl font-display tracking-tight">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-16 px-8 shrink-0">
              {["Helios Capital", "NorthStar VC", "Mercury Labs", "Atlas Trade", "Vector Group", "Obsidian Co.", "Lumen Health"].map((b) => (
                <span key={b}>{b}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* WHY INDIA */}
      <section className="py-24 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-emerald-400 mb-4">Built for India first</div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter leading-tight">
                ₹10,319 crore lost to digital fraud in 2024 alone.
              </h2>
              <p className="mt-5 text-zinc-400 leading-relaxed max-w-lg">
                Indians lose more to UPI scams, fake job consultancies, WhatsApp investment groups and EdTech fraud than any other country. Nexar is built to stop that — fluent in Indian scam patterns, priced for India, and verdict-fast enough to share before you Send.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
                <div className="glass rounded-2xl p-5">
                  <div className="font-display text-3xl font-bold">3.8L+</div>
                  <div className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">UPI complaints in 2024</div>
                </div>
                <div className="glass rounded-2xl p-5">
                  <div className="font-display text-3xl font-bold">67%</div>
                  <div className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Job offers we flag as fake</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { t: "UPI Request Scams", d: "Pasted UPI IDs decoded for risk before you pay." },
                { t: "Fake Recruiters", d: "Ghost consultancies & fee-asking 'HR' detected." },
                { t: "Telegram Trading", d: "Pump-and-dump groups identified in seconds." },
                { t: "EdTech Frauds", d: "Course refund traps and fake placement claims." },
              ].map((c) => (
                <div key={c.t} className="glass rounded-2xl p-5">
                  <div className="font-medium text-sm">{c.t}</div>
                  <div className="text-xs text-zinc-500 mt-2 leading-relaxed">{c.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-400 mb-4">Capabilities</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">A multi-pass AI that doesn't get sweet-talked.</h2>
            <p className="mt-4 text-zinc-400">Nexar runs 6 parallel reasoning passes per query — adversarial, sentiment, financial, structural, technical, and behavioural.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="glass rounded-3xl p-7 hover:-translate-y-1 hover:border-white/20 transition"
              >
                <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 grid place-items-center mb-5">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-display text-xl font-bold tracking-tight">{f.title}</h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold tracking-tighter">13+ categories. One verdict engine.</h2>
            <p className="mt-3 text-zinc-400">Whatever you're about to commit to — money, time, or trust — paste it in.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORIES.map((c) => (
              <div key={c.label} className="glass rounded-2xl p-5 flex flex-col items-center text-center hover:-translate-y-1 transition" data-testid={`category-${c.label}`}>
                <c.icon className="h-5 w-5 text-zinc-300 mb-3" />
                <span className="text-sm text-zinc-300">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass rounded-3xl p-8">
                <p className="text-lg leading-relaxed text-zinc-200">"{t.body}"</p>
                <div className="mt-6 flex items-center gap-4">
                  <img src={t.img} alt={t.name} className="h-12 w-12 rounded-full object-cover border border-white/10" />
                  <div>
                    <div className="text-sm font-bold">{t.name}</div>
                    <div className="text-xs text-zinc-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-400 mb-4">Pricing</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">Decisions priced like infrastructure.</h2>
            <p className="mt-4 text-zinc-400">Start free. Upgrade when one saved scam pays for the year.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TIERS.map((t) => (
              <div key={t.name}
                className={`glass rounded-3xl p-8 flex flex-col ${t.highlight ? "border-white/30 ring-1 ring-white/20" : ""}`}
                data-testid={`pricing-${t.name}`}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-xl font-bold tracking-tight">{t.name}</h3>
                  {t.highlight && <span className="text-[10px] uppercase tracking-widest text-emerald-400">Most popular</span>}
                </div>
                <div className="mt-6 font-display text-5xl font-light tracking-tighter">{t.price}<span className="text-base text-zinc-500">/mo</span></div>
                <p className="mt-2 text-sm text-zinc-500">{t.desc}</p>
                <ul className="mt-8 space-y-3 text-sm flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-3 items-start">
                      <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /><span className="text-zinc-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className={`mt-8 inline-flex justify-center items-center h-11 rounded-xl text-sm font-medium transition ${t.highlight ? "bg-white text-black hover:bg-zinc-200" : "border border-white/15 text-white hover:bg-white/5"}`}>
                  Choose {t.name} <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-bold tracking-tighter text-center mb-12">Frequently asked</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((f, i) => (
              <AccordionItem value={`item-${i}`} key={i} className="glass rounded-2xl px-6 border-0" data-testid={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-zinc-400">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30 grid-bg" />
            <Sparkles className="h-8 w-8 mx-auto text-white relative" />
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-bold tracking-tighter relative">Stop guessing. Start verifying.</h2>
            <p className="mt-4 text-zinc-400 relative">Join 4,000+ buyers, recruiters and investors using Nexar before every commitment.</p>
            <Link to="/signup" className="relative mt-8 inline-flex items-center h-12 px-6 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition" data-testid="cta-signup-bottom">
              Get started free <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between gap-6 items-start">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-white grid place-items-center"><Sparkles className="h-3.5 w-3.5 text-black" /></div>
              <span className="font-display font-bold tracking-tighter">Nexar</span>
            </div>
            <p className="text-xs text-zinc-500 mt-3 max-w-xs">The AI decision engine. Built for people who don't like being scammed.</p>
          </div>
          <div className="text-xs text-zinc-500 flex gap-6">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </div>
          <div className="text-xs text-zinc-600">© 2026 Nexar Labs · All rights reserved</div>
        </div>
      </footer>
    </div>
  );
}
