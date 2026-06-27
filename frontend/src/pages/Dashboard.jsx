import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { History, Bookmark, Flame, AlertTriangle, Award, Star, ArrowUpRight } from "lucide-react";
import Nav from "@/components/Nav";
import SearchBox from "@/components/SearchBox";
import ChatDrawer from "@/components/ChatDrawer";
import { nexar } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const verdictStyles = {
  strong_buy: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  buy: "text-emerald-300 border-emerald-300/30 bg-emerald-300/10",
  caution: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  avoid: "text-rose-400 border-rose-400/30 bg-rose-400/10",
  investigate: "text-zinc-300 border-zinc-300/20 bg-zinc-300/10",
};

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [reports, setReports] = useState([]);
  const [scams, setScams] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!user) { nav("/login"); return; }
    Promise.all([nexar.reports(), nexar.trendingScams(), nexar.trendingProducts()])
      .then(([r, s, p]) => { setReports(r); setScams(s); setProducts(p); })
      .catch(() => {});
  }, [user, nav]);

  if (!user) return null;
  const saved = reports.filter((r) => r.bookmarked);

  return (
    <div className="relative min-h-screen text-white">
      <Nav />
      <div className="aurora opacity-40" />
      <main className="relative pt-28 pb-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-400 mb-3">Dashboard</div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">Welcome back, {user.name.split(" ")[0]}.</h1>
            <p className="text-zinc-500 mt-2 text-sm">Your decisions, scored and saved.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3" data-testid="stat-reputation">
              <Award className="h-4 w-4 text-emerald-400" />
              <div className="text-xs">
                <div className="text-zinc-500 uppercase tracking-widest text-[10px]">Reputation</div>
                <div className="font-display font-bold">{user.reputation}</div>
              </div>
            </div>
            <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3" data-testid="stat-plan">
              <Star className="h-4 w-4 text-white" />
              <div className="text-xs">
                <div className="text-zinc-500 uppercase tracking-widest text-[10px]">Plan</div>
                <div className="font-display font-bold capitalize">{user.plan}</div>
              </div>
            </div>
          </div>
        </motion.div>

        <SearchBox />

        <div className="mt-12 grid lg:grid-cols-3 gap-5">
          <Section icon={History} title="Recent Analyses" testid="recent-section" className="lg:col-span-2">
            {reports.length === 0 ? <Empty msg="Your reports will appear here." /> : (
              <div className="divide-y divide-white/5">
                {reports.slice(0, 8).map((r) => (
                  <Link key={r.id} to={`/report/${r.id}`} data-testid={`report-row-${r.id}`}
                    className="flex items-center justify-between py-4 hover:bg-white/5 px-2 rounded-lg transition">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.data?.title || r.query}</div>
                      <div className="text-xs text-zinc-500 capitalize">{r.category} · {new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Pill v={r.data?.trust_score} label="Trust" />
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${verdictStyles[r.data?.recommendation] || verdictStyles.investigate}`}>
                        {r.data?.recommendation?.replace("_", " ")}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-zinc-500" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <Section icon={Bookmark} title="Saved Reports" testid="saved-section">
            {saved.length === 0 ? <Empty msg="Bookmark reports to save them here." /> : (
              <ul className="space-y-3">
                {saved.slice(0, 6).map((r) => (
                  <li key={r.id}><Link to={`/report/${r.id}`} className="block py-2 hover:text-white text-zinc-300 text-sm">{r.data?.title || r.query}</Link></li>
                ))}
              </ul>
            )}
          </Section>

          <Section icon={AlertTriangle} title="Trending Scams" testid="trending-scams">
            {scams.length === 0 ? <Empty msg="No flagged scams yet — be the first." /> : (
              <ul className="space-y-3">
                {scams.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                    <Link to={`/report/${s.id}`} className="truncate text-zinc-300 hover:text-white">{s.data?.title || s.query}</Link>
                    <span className="text-amber-400 text-xs shrink-0">Risk {s.data?.risk_score ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section icon={Flame} title="Trending Products" testid="trending-products" className="lg:col-span-2">
            {products.length === 0 ? <Empty msg="High-value picks will appear here." /> : (
              <div className="grid sm:grid-cols-2 gap-3">
                {products.map((p) => (
                  <Link key={p.id} to={`/report/${p.id}`} className="glass rounded-xl p-4 hover:-translate-y-0.5 transition">
                    <div className="text-xs text-zinc-500 capitalize">{p.category}</div>
                    <div className="font-medium mt-1 truncate">{p.data?.title || p.query}</div>
                    <div className="mt-2 flex gap-2 text-xs">
                      <span className="text-emerald-400">Trust {p.data?.trust_score}</span>
                      <span className="text-white">Value {p.data?.value_score}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Section>
        </div>
      </main>
      <ChatDrawer />
    </div>
  );
}

const Section = ({ icon: Icon, title, children, className = "", testid }) => (
  <section className={`glass rounded-3xl p-6 ${className}`} data-testid={testid}>
    <div className="flex items-center gap-2 mb-5">
      <Icon className="h-4 w-4 text-zinc-400" />
      <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-400">{title}</h2>
    </div>
    {children}
  </section>
);

const Empty = ({ msg }) => <div className="text-sm text-zinc-600 py-6">{msg}</div>;

const Pill = ({ v, label }) => (
  <span className="text-[10px] uppercase tracking-widest text-zinc-400 px-2 py-1 rounded-full border border-white/10">
    {label} {v ?? "—"}
  </span>
);
