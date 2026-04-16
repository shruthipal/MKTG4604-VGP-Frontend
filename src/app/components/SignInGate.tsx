import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2, ShoppingBag, User, Lock, ArrowLeft,
  Loader2, AlertCircle, ChevronDown, UserPlus, Zap, CheckCircle,
} from "lucide-react";
import { getUserToken, registerBusiness, registerBuyer } from "../lib/api";

interface Props {
  portalType: "business" | "buyer";
  onGuest: () => void;
  onSignIn: (token: string, email: string, role: string) => void;
}

export default function SignInGate({ portalType, onGuest, onSignIn }: Props) {
  const navigate = useNavigate();
  const PortalIcon = portalType === "business" ? Building2 : ShoppingBag;

  const [rightMode, setRightMode] = useState<null | "signin" | "register">(null);

  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siLoading, setSiLoading] = useState(false);
  const [siError, setSiError] = useState("");

  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regSegment, setRegSegment] = useState<"nonprofit" | "reseller" | "smb">("nonprofit");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  const handleSignIn = async () => {
    if (!siEmail || !siPassword) return;
    setSiLoading(true); setSiError("");
    try {
      const { token, role } = await getUserToken(siEmail, siPassword);
      onSignIn(token, siEmail, role);
    } catch (err) {
      setSiError(err instanceof Error ? err.message : "Sign in failed");
    } finally { setSiLoading(false); }
  };

  const handleRegister = async () => {
    if (!regEmail || !regPassword) { setRegError("Email and password required."); return; }
    if (regPassword.length < 8) { setRegError("Password must be at least 8 characters."); return; }
    if (regPassword !== regConfirm) { setRegError("Passwords do not match."); return; }
    setRegLoading(true); setRegError("");
    try {
      if (portalType === "business") {
        await registerBusiness(regEmail, regPassword);
      } else {
        await registerBuyer({ email: regEmail, password: regPassword, segment: regSegment, preferences: [], budget_min: 0, budget_max: 0 });
      }
      const { token, role } = await getUserToken(regEmail, regPassword);
      onSignIn(token, regEmail, role);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Registration failed");
    } finally { setRegLoading(false); }
  };

  const toggleMode = (mode: "signin" | "register") =>
    setRightMode(prev => prev === mode ? null : mode);

  const inputCls = "w-full px-4 py-2.5 bg-white/10 border border-white/15 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all";
  const btnPrimaryCls = "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0B1F16" }}>
      {/* Top nav */}
      <nav className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-400 flex items-center justify-center">
            <Zap className="w-3 h-3 text-[#0B1F16]" fill="currentColor" />
          </div>
          <span className="text-white font-bold text-sm">Surplus Connect</span>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* ── Left: Guest ── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-white/10 p-7 flex flex-col"
            style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-5">
              <User className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Browse as Guest</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Explore matches instantly — no account needed.
            </p>
            <ul className="space-y-2 mb-7 flex-1">
              {["Search and browse all matches", "View match scores and insights", "See item details and categories"].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-gray-300 text-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> {f}
                </li>
              ))}
              {["Contact info hidden", "Cannot express interest", "Inbox not available"].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-gray-600 text-sm">
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-700 flex-shrink-0" />
                  <span className="line-through decoration-gray-700">{f}</span>
                </li>
              ))}
            </ul>
            <button onClick={onGuest} className="w-full py-3 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-all">
              Continue as Guest
            </button>
          </motion.div>

          {/* ── Right: Sign In / Register ── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="flex flex-col gap-3"
          >
            <div className="mb-1">
              <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center mb-4">
                <PortalIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {portalType === "business" ? "Business Portal" : "Buyer Portal"}
              </h1>
              <p className="text-gray-400 text-sm">Sign in or create an account for full access.</p>
            </div>

            {/* Sign In */}
            <div className="rounded-xl overflow-hidden border border-white/10">
              <button
                onClick={() => toggleMode("signin")}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-all ${rightMode === "signin" ? "bg-emerald-600" : "bg-white/6 hover:bg-white/10"}`}
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-white" />
                  <span className="text-white font-semibold text-sm">Sign In</span>
                  {rightMode !== "signin" && <span className="text-gray-400 text-xs">— I have an account</span>}
                </div>
                <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${rightMode === "signin" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {rightMode === "signin" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="px-5 py-4 space-y-3">
                      <input type="email" value={siEmail} onChange={(e) => setSiEmail(e.target.value)} placeholder="Email address" className={inputCls} />
                      <input type="password" value={siPassword} onChange={(e) => setSiPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSignIn()} placeholder="Password" className={inputCls} />
                      {siError && <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/15 rounded-lg p-2.5"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{siError}</div>}
                      <button onClick={handleSignIn} disabled={!siEmail || !siPassword || siLoading} className={`${btnPrimaryCls} bg-emerald-500 text-white hover:bg-emerald-400`}>
                        {siLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : "Sign In"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Create Account */}
            <div className="rounded-xl overflow-hidden border border-white/10">
              <button
                onClick={() => toggleMode("register")}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-all ${rightMode === "register" ? "bg-emerald-700" : "bg-white/6 hover:bg-white/10"}`}
              >
                <div className="flex items-center gap-2.5">
                  <UserPlus className="w-4 h-4 text-white" />
                  <span className="text-white font-semibold text-sm">Create Account</span>
                  {rightMode !== "register" && <span className="text-gray-400 text-xs">— I'm new here</span>}
                </div>
                <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${rightMode === "register" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {rightMode === "register" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="px-5 py-4 space-y-3">
                      <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Email address" className={inputCls} />
                      <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Password (min 8 chars)" className={inputCls} />
                      <input type="password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRegister()} placeholder="Confirm password" className={inputCls} />
                      {portalType === "buyer" && (
                        <div>
                          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold">Organization type</p>
                          <div className="grid grid-cols-3 gap-2">
                            {(["nonprofit", "reseller", "smb"] as const).map((s) => (
                              <button key={s} onClick={() => setRegSegment(s)} className={`py-2 rounded-lg text-xs font-semibold transition-all ${regSegment === s ? "bg-emerald-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/15"}`}>
                                {s === "nonprofit" ? "Nonprofit" : s === "reseller" ? "Reseller" : "Business"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {regError && <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/15 rounded-lg p-2.5"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{regError}</div>}
                      <button onClick={handleRegister} disabled={!regEmail || !regPassword || !regConfirm || regLoading} className={`${btnPrimaryCls} bg-emerald-600 text-white hover:bg-emerald-500`}>
                        {regLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : "Create Account"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Benefits */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-5 py-4">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2.5">With an account</p>
              <ul className="space-y-1.5">
                {[
                  "View contact info for matches",
                  "Express interest & send messages",
                  "Access your inbox",
                  portalType === "business" ? "Add & upload inventory" : "Save your buyer profile",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-emerald-200">
                    <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
