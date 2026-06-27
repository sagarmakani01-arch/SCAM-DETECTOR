import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileText, MessageSquare, AlertOctagon, Loader2 } from "lucide-react";
import Nav from "@/components/Nav";
import { useAuth } from "@/context/AuthContext";
import { nexar } from "@/lib/api";
import { toast } from "sonner";

export default function Admin() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [overview, setOverview] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/login"); return; }
    nexar.adminOverview().then(setOverview).catch((e) => {
      const msg = e?.response?.status === 403 ? "Admin access required" : "Failed to load admin data";
      setErr(msg);
      toast.error(msg);
    });
  }, [user, loading, nav]);

  return (
    <div className="relative min-h-screen text-white">
      <Nav />
      <div className="aurora opacity-30" />
      <main className="relative pt-28 pb-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.3em] text-emerald-400 mb-3">Admin</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">Control room.</h1>
          <p className="text-zinc-500 mt-2 text-sm">Platform metrics, content moderation and scam database health.</p>
        </div>

        {err && <div className="glass rounded-2xl p-6 text-rose-400 text-sm" data-testid="admin-error">{err}</div>}

        {!overview && !err && (
          <div className="glass rounded-2xl p-12 grid place-items-center text-zinc-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
        )}

        {overview && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Tile icon={Users} label="Users" value={overview.users} testid="admin-users" />
            <Tile icon={FileText} label="Reports" value={overview.reports} testid="admin-reports" />
            <Tile icon={MessageSquare} label="Reviews" value={overview.reviews} testid="admin-reviews" />
            <Tile icon={AlertOctagon} label="Scam Reports" value={overview.scam_reports} testid="admin-scam-reports" />
          </div>
        )}

        <div className="mt-8 grid lg:grid-cols-2 gap-5">
          <Panel title="Content Moderation Queue">
            <p className="text-sm text-zinc-500">No pending items. Community reviews and user-submitted scam reports will surface here for review.</p>
          </Panel>
          <Panel title="Scam Database">
            <p className="text-sm text-zinc-500">Seeded with 6 India-localized scam patterns. Add new patterns via the API or seed file.</p>
          </Panel>
          <Panel title="AI Usage">
            <p className="text-sm text-zinc-500">Claude Sonnet 4.5 via Emergent LLM Key. Tracking dashboard ships in v3.</p>
          </Panel>
          <Panel title="Category Management">
            <p className="text-sm text-zinc-500">13 categories live. Edit via /backend/server.py ANALYSIS_SYSTEM.</p>
          </Panel>
        </div>
      </main>
    </div>
  );
}

const Tile = ({ icon: Icon, label, value, testid }) => (
  <div className="glass rounded-3xl p-6" data-testid={testid}>
    <Icon className="h-4 w-4 text-zinc-400 mb-3" />
    <div className="font-display text-4xl font-bold tracking-tighter">{value}</div>
    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mt-2">{label}</div>
  </div>
);

const Panel = ({ title, children }) => (
  <div className="glass rounded-3xl p-7">
    <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-400 mb-4">{title}</h3>
    {children}
  </div>
);
