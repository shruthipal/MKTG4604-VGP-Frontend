import { useState } from "react";
import { Sparkles, Building2, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import BusinessView from "../components/BusinessView";
import NonprofitView from "../components/NonprofitView";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"business" | "buyer">("business");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-gray-200 bg-white shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-700 to-teal-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="mb-2 text-3xl font-bold text-emerald-900">Surplus Connect</h1>
              <p className="text-gray-600 max-w-3xl">
                Smart marketplace connecting business surplus with organizations in need. Simple, direct matching that creates real impact.
              </p>
            </div>
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
              <span>Businesses</span>
            </button>
            <button
              onClick={() => setActiveTab("buyer")}
              className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all font-medium ${
                activeTab === "buyer"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-gray-600 hover:text-teal-600 hover:bg-white"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Organizations in Need</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 min-h-screen">
        {activeTab === "business" ? <BusinessView /> : <NonprofitView />}
      </main>
    </div>
  );
}
