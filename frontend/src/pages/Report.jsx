import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check, X, AlertTriangle, ShieldCheck, Sparkles, ExternalLink, Bookmark, MessagesSquare,
  TrendingUp, DollarSign, AlertOctagon, Lightbulb, Lock, ArrowLeft,
} from "lucide-react";
import Nav from "@/components/Nav";
import ChatDrawer from "@/components/ChatDrawer";
import { nexar } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const verdictStyles = {
  strong_buy: { c: "text-emerald-400", b: "border-emerald-400/40", bg: "bg-emerald-400/5" },
  buy: { c: "text-emerald-300", b: "border-emerald-300/40", bg: "bg-emerald-300/5" },
  caution: { c: "text-amber-400", b: "border-amber-400/40", bg: "bg-amber-400/5" },
  avoid: { c: "text-rose-400", b: "border-rose-400/40", bg: "bg-rose-400/5" },
  investigate: { c: "text-zinc-200", b: "border-zinc-300/30", bg: "bg-zinc-300/5" },
};

export default function Report() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ title: "", body: "", rating: 5 });

  useEffect(() => {
    nexar.report(id).then((r) => { setReport(r); setBookmarked(r.bookmarked); }).catch(() => toast.error("Report not found"));
    nexar.reviews(id).then(setReviews).catch(() => {});
  }, [id]);

  if (!report) return <div className="min-h-screen grid place-items-center text-zinc-400">Loading report…</div>;
  const d = report.data;
  const vs = verdictStyles[d.recommendation] || verdictStyles.investigate;

  const toggleBookmark = async () => {
    if (!user) return toast.info("Sign in to bookmark");
    const { bookmarked } = await nexar.bookmark(id);
    setBookmarked(bookmarked);
    toast.success(bookmarked ? "Saved to your collection" : "Removed from collection");
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.info("Sign in to post reviews");
    const review = await nexar.postReview({ report_id: id, ...reviewForm });
    setReviews([review, ...reviews]);
    setReviewForm({ title: "", body: "", rating: 5 });
    toast.success("Review posted");
  };

  return (
    <div className="relative min-h-screen text-white">
      <Nav />
      <div className="aurora opacity-40" />
      <main className="relative pt-28 pb-24 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="inline-flex items-center text-xs text-zinc-500 hover:text-white" data-testid="back-link">
          <ArrowLeft className="h-3 w-3 mr-1" /> Back to dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-3xl p-8 sm:p-10">
          <div className="flex flex-col lg:flex-row gap-8 justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="text-xs uppercase tracking-[0.3em] text-zinc-500 capitalize">{d.category}</span>
                <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border ${vs.b} ${vs.bg} ${vs.c}`}>
                  {d.recommendation?.replace("_", " ")}
                </span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">{d.title}</h1>
              <p className="mt-4 text-zinc-400 leading-relaxed max-w-2xl">{d.summary}</p>
              <p className={`mt-5 text-lg ${vs.c}`}>{d.verdict_line}</p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button onClick={toggleBookmark} data-testid="bookmark-btn"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-white/15 hover:bg-white/5 text-sm">
                  <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-white" : ""}`} /> {bookmarked ? "Saved" : "Save"}
                </button>
                <a href={`mailto:?subject=Nexar verdict on ${encodeURIComponent(d.title)}&body=${encodeURIComponent(d.verdict_line)}`}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-white/15 hover:bg-white/5 text-sm" data-testid="share-btn">
                  <ExternalLink className="h-4 w-4" /> Share
                </a>
              </div>
            </div>

            <div className="flex gap-3 lg:flex-col">
              <ScoreBox label="Trust" value={d.trust_score} color="emerald" />
              <ScoreBox label="Risk" value={d.risk_score} color="amber" inverse />
              <ScoreBox label="Value" value={d.value_score} color="white" />
            </div>
          </div>
        </motion.div>

        <div className="mt-6 grid lg:grid-cols-2 gap-5">
          <Card icon={Check} title="Pros" items={d.pros} color="text-emerald-400" testid="pros" />
          <Card icon={X} title="Cons" items={d.cons} color="text-rose-400" testid="cons" />
          <Card icon={DollarSign} title="Hidden Costs" items={d.hidden_costs} color="text-amber-400" testid="hidden-costs" />
          <Card icon={MessagesSquare} title="Common Complaints" items={d.common_complaints} color="text-zinc-300" testid="complaints" />
          <Card icon={AlertOctagon} title="Scam Indicators" items={d.scam_indicators} color="text-rose-300" testid="scam-indicators" />
          <Card icon={AlertTriangle} title="Fake Review Signals" items={d.fake_review_signals} color="text-amber-300" testid="fake-reviews" />
          <Card icon={Lightbulb} title="Buying Tips" items={d.buying_tips} color="text-emerald-300" testid="buying-tips" />
          <Card icon={TrendingUp} title="Long-Term Insights" items={d.long_term_insights} color="text-zinc-300" testid="long-term" />
        </div>

        {d.alternatives?.length > 0 && (
          <section className="mt-6 glass rounded-3xl p-7" data-testid="alternatives">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="h-4 w-4" />
              <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-300">Better Alternatives</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {d.alternatives.map((a, i) => (
                <div key={i} className="glass rounded-2xl p-5">
                  <div className="font-display text-lg font-bold tracking-tight">{a.name}</div>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{a.why}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-6 grid lg:grid-cols-2 gap-5">
          {d.url_safety && (
            <div className="glass rounded-3xl p-7" data-testid="url-safety">
              <div className="flex items-center gap-2 mb-3"><Lock className="h-4 w-4" /><h3 className="text-sm uppercase tracking-[0.2em]">URL Safety</h3></div>
              <div className="font-display text-2xl font-bold capitalize">{d.url_safety.verdict}</div>
              <p className="text-sm text-zinc-400 mt-2">{d.url_safety.notes}</p>
            </div>
          )}
          {d.warranty && (
            <div className="glass rounded-3xl p-7" data-testid="warranty">
              <div className="flex items-center gap-2 mb-3"><ShieldCheck className="h-4 w-4" /><h3 className="text-sm uppercase tracking-[0.2em]">Warranty</h3></div>
              <p className="text-sm text-zinc-300">{d.warranty}</p>
            </div>
          )}
        </div>

        {/* Community */}
        <section className="mt-8 glass rounded-3xl p-7" data-testid="community-section">
          <h2 className="font-display text-2xl font-bold tracking-tight mb-5">Community Reviews</h2>
          <form onSubmit={submitReview} className="grid sm:grid-cols-2 gap-3 mb-6">
            <input data-testid="review-title-input" required placeholder="Headline (e.g., Worked for me)" value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              className="h-11 px-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30" />
            <select data-testid="review-rating-select" value={reviewForm.rating}
              onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
              className="h-11 px-4 bg-white/5 border border-white/10 rounded-xl outline-none">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
            </select>
            <textarea data-testid="review-body-input" required placeholder="What did you experience?" value={reviewForm.body}
              onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
              className="sm:col-span-2 min-h-[100px] p-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30" />
            <button data-testid="post-review-btn" className="sm:col-span-2 h-11 rounded-xl bg-white text-black font-medium hover:bg-zinc-200">Post review</button>
          </form>
          <div className="space-y-3">
            {reviews.length === 0 && <div className="text-sm text-zinc-600">No reviews yet — be first.</div>}
            {reviews.map((r) => (
              <div key={r.id} className="border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-amber-400">{"★".repeat(r.rating)}</div>
                </div>
                <p className="text-sm text-zinc-400 mt-2">{r.body}</p>
                <div className="text-xs text-zinc-600 mt-2">{r.user_name} · {new Date(r.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <ChatDrawer reportContext={d?.title} />
    </div>
  );
}

const ScoreBox = ({ label, value, color, inverse }) => {
  const num = typeof value === "number" ? value : 0;
  const palette = {
    emerald: "text-emerald-400 border-emerald-400/30",
    amber: "text-amber-400 border-amber-400/30",
    white: "text-white border-white/30",
  }[color];
  return (
    <div className={`glass rounded-2xl px-5 py-4 min-w-[120px] border ${palette}`}>
      <div className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</div>
      <div className="font-display text-4xl font-light tracking-tighter mt-1">{num}<span className="text-base text-zinc-500">/100</span></div>
      <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full ${color === "emerald" ? "bg-emerald-400" : color === "amber" ? "bg-amber-400" : "bg-white"}`} style={{ width: `${num}%` }} />
      </div>
    </div>
  );
};

const Card = ({ icon: Icon, title, items, color, testid }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="glass rounded-3xl p-6" data-testid={`card-${testid}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`h-4 w-4 ${color}`} />
        <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-300">{title}</h3>
      </div>
      <ul className="space-y-2.5 text-sm text-zinc-300">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2.5 leading-relaxed">
            <span className={`mt-1.5 h-1 w-1 rounded-full ${color.replace("text-", "bg-")} shrink-0`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
