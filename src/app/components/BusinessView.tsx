import { useState, useEffect } from "react";
import {
  Building2, Package, DollarSign, Search,
  AlertCircle, MapPin, Loader2, Heart, Users, Briefcase, Tag,
} from "lucide-react";
import { motion } from "motion/react";
import { searchInterestedBuyers, BuyerInterestCard } from "../lib/api";

interface BusinessViewProps {
  onSelectBuyer?: (buyer: BuyerInterestCard) => void;
}

export default function BusinessView({ onSelectBuyer }: BusinessViewProps) {
  const [companyName, setCompanyName] = useState("");
  const [inventory, setInventory] = useState("");
  const [location, setLocation] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyers, setBuyers] = useState<BuyerInterestCard[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("businessFormData");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCompanyName(data.companyName || "");
        setInventory(data.inventory || "");
        setLocation(data.location || "");
        setEstimatedValue(data.estimatedValue || "");
        setQuantity(data.quantity || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    const formData = { companyName, inventory, location, estimatedValue, quantity };
    localStorage.setItem("businessFormData", JSON.stringify(formData));
  }, [companyName, inventory, location, estimatedValue, quantity]);


  const handleFindMatches = async () => {
    if (!inventory.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const result = await searchInterestedBuyers(inventory);
      setBuyers(result.buyers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBuyers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearResults = () => {
    setBuyers([]);
    setHasSearched(false);
    setError(null);
  };

  return (
    <>
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-5">Your Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Organization Name
              </label>
              <input
                type="text"
                placeholder="e.g., ABC Corp, Local Bakery"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <Package className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                  Item Available
                </label>
                <input
                  type="text"
                  placeholder="e.g., doughnuts, laptops, clothing"
                  value={inventory}
                  onChange={(e) => setInventory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFindMatches()}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Quantity <span className="font-normal text-gray-400 normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 500 daily, 1000 units"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <MapPin className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Boston, MA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <DollarSign className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                  Estimated Value <span className="font-normal text-gray-400 normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., $5,000"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={handleFindMatches}
                  disabled={!inventory.trim() || isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 active:bg-emerald-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-semibold text-sm"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Searching…</>
                  ) : (
                    <><Search className="w-4 h-4" />Find Matches</>
                  )}
                </button>
                {hasSearched && (
                  <button
                    onClick={handleClearResults}
                    className="px-5 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-600 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Could not fetch matches</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {hasSearched && !error && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {buyers.length > 0
                    ? `${buyers.length} organization${buyers.length !== 1 ? "s" : ""} want this`
                    : "No matches found"}
                </h3>
                {buyers.length > 0 && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    Buyers & nonprofits looking for <span className="font-medium text-gray-700">"{inventory}"</span>
                  </p>
                )}
              </div>
              {buyers.length === 0 && (
                <p className="text-sm text-gray-500 max-w-xs text-right">
                  Try a different item type or keyword
                </p>
              )}
            </div>

            <div className="space-y-3">
              {buyers.map((buyer, index) => {
                const segmentConfig = {
                  nonprofit: { label: "Nonprofit", icon: Heart, bg: "bg-rose-50 text-rose-700 border-rose-200" },
                  reseller:  { label: "Reseller",  icon: Tag,   bg: "bg-blue-50 text-blue-700 border-blue-200" },
                  smb:       { label: "Business",  icon: Briefcase, bg: "bg-purple-50 text-purple-700 border-purple-200" },
                }[buyer.segment] ?? { label: buyer.segment, icon: Users, bg: "bg-gray-100 text-gray-600 border-gray-200" };

                const strengthBg =
                  buyer.match_strength === "Strong"   ? "bg-emerald-100 text-emerald-800" :
                  buyer.match_strength === "Good"     ? "bg-blue-100 text-blue-800" :
                                                        "bg-amber-100 text-amber-800";
                const Icon = segmentConfig.icon;

                return (
                  <motion.div
                    key={`${buyer.org_name}-${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => onSelectBuyer?.(buyer)}
                    className={`bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all shadow-sm ${onSelectBuyer ? "cursor-pointer" : ""}`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm leading-snug">{buyer.org_name}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${segmentConfig.bg}`}>
                                <Icon className="w-3 h-3" />
                                {segmentConfig.label}
                              </span>
                              {buyer.location && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {buyer.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${strengthBg}`}>
                          {buyer.match_strength} match
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{buyer.wants}</p>

                      {buyer.preferences.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {buyer.preferences.map((pref) => (
                            <span key={pref} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                              {pref}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {onSelectBuyer && (
                      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Click to view details & contact</span>
                        <span className="text-xs font-semibold text-emerald-700">Express Interest →</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {buyers.length > 0 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Have different inventory?{" "}
                  <button
                    onClick={() => { handleClearResults(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="text-emerald-700 font-semibold hover:underline"
                  >
                    Search again
                  </button>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
    </>
  );
}
