import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Zap, Building2, ShoppingBag, ArrowRight, Sparkles, Heart, Tag, Briefcase } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0B1F16" }}
    >
      {/* Top Nav */}
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-400 flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#0B1F16]" fill="currentColor" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Surplus Connect</span>
        </div>
        <div className="px-4 py-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 text-xs font-semibold tracking-wide">
          Sustainability Platform
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 px-4 py-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 flex items-center gap-2 text-emerald-300 text-sm font-medium"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Reduce waste. Create impact.
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-6xl font-extrabold text-white text-center mb-5 leading-tight tracking-tight max-w-3xl"
        >
          Turn surplus into{" "}
          <span className="text-emerald-400">opportunity.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-400 text-lg text-center max-w-xl mb-12 leading-relaxed"
        >
          We connect businesses with excess inventory to nonprofits and buyers
          who need it — using smart matching to redirect surplus away from landfill.
        </motion.p>

        {/* Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col md:flex-row gap-5 w-full max-w-2xl mb-14"
        >
          {/* Business Card */}
          <motion.button
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/business")}
            className="flex-1 relative group text-left rounded-2xl p-7 border border-white/10 overflow-hidden transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: "radial-gradient(circle at 30% 30%, rgba(52,211,153,0.12) 0%, transparent 70%)" }} />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">I'm a Business</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                List your surplus inventory and let our matching engine find the best buyers for your products instantly.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold group-hover:gap-3 transition-all">
                Get Started <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>

          {/* Buyer Card */}
          <motion.button
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/buyer")}
            className="flex-1 relative group text-left rounded-2xl p-7 border border-white/10 overflow-hidden transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: "radial-gradient(circle at 70% 30%, rgba(52,211,153,0.12) 0%, transparent 70%)" }} />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center mb-5">
                <ShoppingBag className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">I'm a Buyer</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                Discover surplus goods perfectly matched to your organization's needs and budget.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold group-hover:gap-3 transition-all">
                Find Surplus <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* Impact chips — honest, no fake stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-16"
        >
          {[
            "Free for nonprofits",
            "No waste to landfill",
            "Community-first matching",
          ].map((chip) => (
            <span
              key={chip}
              className="px-4 py-1.5 rounded-full border border-emerald-800 bg-emerald-900/30 text-emerald-300 text-xs font-semibold"
            >
              {chip}
            </span>
          ))}
        </motion.div>

        {/* Divider */}
        <div className="w-full max-w-2xl border-t border-white/8 mb-14" />

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="w-full max-w-2xl"
        >
          <p className="text-xs uppercase tracking-widest text-gray-500 text-center mb-8 font-semibold">How it works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: <Tag className="w-5 h-5 text-emerald-400" />,
                title: "List your surplus",
                desc: "Businesses add their excess inventory with details on quantity, condition, and availability.",
              },
              {
                step: "02",
                icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
                title: "Smart matching",
                desc: "Our matching engine analyzes buyer profiles and inventory to surface the highest-quality connections.",
              },
              {
                step: "03",
                icon: <Heart className="w-5 h-5 text-emerald-400" />,
                title: "Connect & transact",
                desc: "Buyers discover surplus that fits their needs. Goods get redirected rather than wasted.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-xl p-5 border border-white/8"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold text-emerald-400/60 font-mono">{item.step}</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-400/15 flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-white font-semibold text-sm mb-1.5">{item.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-gray-600 text-xs border-t border-white/5">
        <div className="flex items-center justify-center gap-2">
          <Briefcase className="w-3.5 h-3.5" />
          <span>Surplus Connect — Reducing waste, creating impact.</span>
        </div>
      </div>
    </div>
  );
}
