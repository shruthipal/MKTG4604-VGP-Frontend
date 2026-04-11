import { Sparkles, Building2, ShoppingCart, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onSelectRole: (role: "business" | "buyer") => void;
}

export default function LandingPage({ onSelectRole }: LandingPageProps) {
  return (
    <div className="h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 max-w-2xl"
      >
        {/* Logo */}
        <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Sparkles className="w-8 h-8" />
        </div>

        {/* Title */}
        <h1 className="mb-3 text-4xl font-bold text-teal-900">Surplus Connect</h1>

        {/* Tagline - Single line */}
        <p className="text-base text-gray-600 font-medium leading-snug">
          Tell us what excess you have available, we will connect you with the best buyers based on your needs and Smart marketplace connecting business surplus with organizations in need. Simple, direct matching that creates real impact.
        </p>
      </motion.div>

      {/* Selection Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 w-full max-w-3xl"
      >
        {/* Business Card */}
        <motion.button
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectRole("business")}
          className="flex-1 bg-white border-2 border-emerald-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:border-emerald-600"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-700 to-emerald-600 text-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-emerald-900 mb-2">I'm a Business</h2>
          <p className="text-sm text-gray-600 mb-4">
            Have excess inventory? Connect with buyers.
          </p>
          <div className="flex items-center justify-center gap-2 text-emerald-700 font-semibold group text-sm">
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>

        {/* Buyer Card */}
        <motion.button
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectRole("buyer")}
          className="flex-1 bg-white border-2 border-amber-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:border-amber-600"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-amber-500 text-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-amber-900 mb-2">I'm a Buyer</h2>
          <p className="text-sm text-gray-600 mb-4">
            Looking for great prices? Find surplus inventory.
          </p>
          <div className="flex items-center justify-center gap-2 text-amber-700 font-semibold group text-sm">
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}
