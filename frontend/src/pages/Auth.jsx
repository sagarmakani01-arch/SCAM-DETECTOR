import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Auth({ mode = "login" }) {
  const isLogin = mode === "login";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await signup(form.name, form.email, form.password);
      toast.success(isLogin ? "Welcome back" : "Account created");
      nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Authentication failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative text-white">
      <div className="hidden lg:block relative overflow-hidden">
        <div className="aurora" />
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="orb scale-90" />
        </div>
        <div className="absolute bottom-12 left-12 right-12 glass rounded-2xl p-6">
          <p className="text-lg leading-relaxed">"Nexar flagged a fake recruiter pitch within 4 seconds — saved me from a 90-day interview process that didn't exist."</p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-zinc-500">— Marcus, Eng Manager</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12 relative">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-10" data-testid="auth-logo">
            <div className="h-8 w-8 rounded-lg bg-white grid place-items-center"><Sparkles className="h-4 w-4 text-black" /></div>
            <span className="font-display text-lg font-bold tracking-tighter">Nexar</span>
          </Link>
          <h1 className="font-display text-4xl font-bold tracking-tighter">{isLogin ? "Welcome back." : "Create your account."}</h1>
          <p className="text-zinc-500 mt-2 text-sm">{isLogin ? "Sign in to access your reports." : "Free forever plan. No credit card."}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">Name</label>
                <input data-testid="auth-name-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-2 w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30 transition" />
              </div>
            )}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</label>
              <input type="email" data-testid="auth-email-input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-2 w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30 transition" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">Password</label>
              <input type="password" data-testid="auth-password-input" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-2 w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30 transition" />
            </div>
            <button data-testid="auth-submit-btn" disabled={loading} className="w-full h-12 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 transition flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogin ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-zinc-500">
            {isLogin ? (<>No account? <Link to="/signup" className="text-white underline-offset-4 hover:underline">Create one</Link></>)
             : (<>Already have an account? <Link to="/login" className="text-white underline-offset-4 hover:underline">Sign in</Link></>)}
          </p>
        </div>
      </div>
    </div>
  );
}
