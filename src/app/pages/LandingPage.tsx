import { Sparkles, Building2, ShoppingCart, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onSelectRole: (role: "business" | "buyer") => void;
}

export default function LandingPage({ onSelectRole }: LandingPageProps) {
  return (
    <div className="h-screen bg-[#F2FBF7] flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 max-w-2xl"
      >
        <div className="w-16 h-16 bg-[#4CAF8E] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Sparkles className="w-8 h-8" />
        </div>

        <h1 className="mb-3 text-4xl font-bold text-[#1E293B]">Surplus Connect</h1>

        <p className="text-base text-[#64748B] font-medium leading-snug">
          Tell us what excess you have available, we will connect you with the best buyers based on your needs. Simple. Easy. Direct.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 w-full max-w-3xl"
      >
        <motion.button
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectRole("business")}
          className="flex-1 bg-white border-2 border-[#1F7A63] rounded-xl p-6 shadow-md hover:bg-[#E6F7F1] hover:shadow-xl transition-all hover:-translate-y-0.5 hover:border-[#134A3C] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1F7A63]/30"
        >
          <div className="w-14 h-14 bg-[#D2F3E7] text-[#134A3C] rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#134A3C] mb-2">I'm a Business</h2>
          <p className="text-sm text-[#64748B] mb-4">
            Have excess inventory? Connect with buyers.
          </p>
          <div className="flex items-center justify-center gap-2 text-[#1F7A63] font-semibold group text-sm">
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectRole("buyer")}
          className="flex-1 bg-white border-2 border-[#4CAF8E] rounded-xl p-6 shadow-md hover:bg-[#D2F3E7] hover:shadow-xl transition-all hover:-translate-y-0.5 hover:border-[#1F7A63] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4CAF8E]/30"
        >
          <div className="w-14 h-14 bg-[#E6F7F1] text-[#1F7A63] rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#1F7A63] mb-2">I'm a Buyer</h2>
          <p className="text-sm text-[#64748B] mb-4">
            Looking for available surplus at competitive prices.
          </p>
          <div className="flex items-center justify-center gap-2 text-[#1F7A63] font-semibold group text-sm">
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}
