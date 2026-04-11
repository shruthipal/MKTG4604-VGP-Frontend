import { useState, useEffect } from "react";
import { Sparkles, Building2, ShoppingCart, Home } from "lucide-react";
import { motion } from "motion/react";
import BusinessView from "../components/BusinessView";
import NonprofitView from "../components/NonprofitView";
import LandingPage from "./LandingPage";

export default function Dashboard() {
  const [onboarded, setOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<"business" | "buyer" | null>(null);

  // Scroll to top when onboarding completes
  useEffect(() => {
    if (onboarded) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [onboarded]);

  const handleSelectRole = (role: "business" | "buyer") => {
    setActiveTab(role);
    setOnboarded(true);
  };
  return (
    <div className="min-h-screen bg-background">
      {!onboarded ? (
        <LandingPage onSelectRole={handleSelectRole} />
      ) : (
        <>
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="border-b border-gray-200 bg-white shadow-sm"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="mb-2 text-3xl font-bold text-teal-900">Surplus Connect</h1>
                    <p className="text-gray-600 max-w-3xl">
                      Tell us what excess you have available, we will connect you with the best buyers based on your needs and Smart marketplace connecting business surplus with organizations in need. Simple, direct matching that creates real impact.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOnboarded(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  title="Back to home"
                >
                  <Home className="w-6 h-6 text-gray-600 hover:text-emerald-700" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit border border-gray-200">
                <button
                  onClick={() => setActiveTab("business")}
                  className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all font-medium ${
                    activeTab === "business"
                      ? "bg-emerald-700 text-white shadow-md"
                      : "text-gray-600 hover:text-emerald-700 hover:bg-white"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>I'm a Business</span>
                </button>
                <button
                  onClick={() => setActiveTab("buyer")}
                  className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all font-medium ${
                    activeTab === "buyer"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-gray-600 hover:text-amber-600 hover:bg-white"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>I'm a Buyer</span>
                </button>
              </div>
            </div>
          </motion.header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 min-h-screen">
            {activeTab === "business" ? <BusinessView /> : <NonprofitView />}
          </main>
        </>
      )}
    </div>
  );
}
