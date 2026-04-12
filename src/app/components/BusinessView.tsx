import { useState, useEffect } from "react";
import {
  Building2, Package, DollarSign, Search, MessageSquare,
  Send, AlertCircle, MapPin, Loader2, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { fetchMatches, RecommendationCard } from "../lib/api";

export default function BusinessView() {
  const [companyName, setCompanyName] = useState("");
  const [inventory, setInventory] = useState("");
  const [location, setLocation] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [matches, setMatches] = useState<RecommendationCard[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

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

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    const input = chatInput.toLowerCase();

    const companyPatterns = [
      /i'?m\s+([a-zA-Z\s&]+?)(?:\s+and|,|\.|$)/i,
      /from\s+([a-zA-Z\s&]+?)(?:\s+and|,|\.|$)/i,
      /we'?re\s+([a-zA-Z\s&]+?)(?:\s+and|,|\.|$)/i,
    ];
    for (const pattern of companyPatterns) {
      const match = input.match(pattern);
      if (match && match[1]?.trim().length > 2) {
        setCompanyName(match[1].trim().charAt(0).toUpperCase() + match[1].trim().slice(1));
        break;
      }
    }

    const quantityPatterns = [
      /(\d+[,\d]*)\s+(extra|excess)?\s*([a-zA-Z\s]+?)(?:\s+every\s+day|daily|per day|a day)/i,
      /(\d+[,\d]*)\s+([a-zA-Z\s]+?)(?:\s+in\s+stock|available)/i,
      /have\s+(\d+[,\d]*)\s+([a-zA-Z\s]+)/i,
    ];
    for (const pattern of quantityPatterns) {
      const match = input.match(pattern);
      if (match) {
        setQuantity(match[1]);
        const itemIndex = match[2] === "extra" || match[2] === "excess" ? 3 : 2;
        if (match[itemIndex]) setInventory(match[itemIndex].trim());
        break;
      }
    }

    if (!inventory) {
      const inventoryPatterns = [
        /(?:extra|excess|surplus)\s+([a-zA-Z\s,]+?)(?:\s+who|$)/i,
        /have\s+(?:some\s+)?([a-zA-Z\s,]+?)(?:\s+who|that|to)/i,
      ];
      for (const pattern of inventoryPatterns) {
        const match = input.match(pattern);
        if (match && match[1]) { setInventory(match[1].trim()); break; }
      }
    }

    const locationPatterns = [
      /(?:in|from|at)\s+([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/,
      /(?:in|from|at)\s+([A-Z][a-zA-Z\s]+)/,
    ];
    for (const pattern of locationPatterns) {
      const match = chatInput.match(pattern);
      if (match && match[1]) { setLocation(match[1].trim()); break; }
    }

    const valueMatch = chatInput.match(/\$(\d+[,\d]*(?:\.\d+)?[kKmM]?)/);
    if (valueMatch) setEstimatedValue("$" + valueMatch[1]);

    setChatInput("");
  };

  const handleFindMatches = async () => {
    if (!inventory.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setExpandedCards(new Set());
    setHasSearched(true);
    try {
      const result = await fetchMatches(inventory);
      setMatches(result.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCard = (itemId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  };

  // Clear results only — keep form filled so the user can search again
  const handleClearResults = () => {
    setMatches([]);
    setHasSearched(false);
    setError(null);
    setExpandedCards(new Set());
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="mb-2 text-gray-900 text-2xl font-bold">For Businesses</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
            Tell us what excess you have available — we'll connect you with the best buyers
          </p>
        </div>

        {/* Example banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Example</p>
          <p className="text-sm text-gray-700 italic">
            "I'm Dunkin' and I have 500 extra doughnuts at the end of every day in Boston, MA."
          </p>
        </div>

        {/* Quick input */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-800">Quick Input</span>
            <span className="text-xs text-gray-400">— describe your surplus</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., I have 500 laptops available in California..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
            />
            <button
              onClick={handleChatSubmit}
              disabled={!chatInput.trim()}
              className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
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
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all"
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all"
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all"
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all"
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
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

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Could not fetch matches</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {hasSearched && !error && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {matches.length > 0
                    ? `Found ${matches.length} match${matches.length !== 1 ? "es" : ""}`
                    : "No matches found"}
                </h3>
                {matches.length > 0 && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    Best buyers for <span className="font-medium text-gray-700">"{inventory}"</span>
                  </p>
                )}
              </div>
              {matches.length === 0 && (
                <p className="text-sm text-gray-500 max-w-xs text-right">
                  Try a different item type or keyword
                </p>
              )}
            </div>

            <div className="space-y-3">
              {matches.map((item, index) => {
                const isExpanded = expandedCards.has(item.item_id);
                const score = item.composite_score;
                const scoreLabel = score >= 0.75 ? "Strong" : score >= 0.5 ? "Good" : "Moderate";
                const scoreBg =
                  score >= 0.75 ? "bg-emerald-100 text-emerald-800" :
                  score >= 0.5  ? "bg-blue-100 text-blue-800" :
                                  "bg-amber-100 text-amber-800";

                return (
                  <motion.div
                    key={item.item_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.07 }}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all shadow-sm"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm leading-snug">{item.title}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 font-medium">
                                {item.category}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                                {item.condition}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-emerald-700 leading-tight">
                            {item.price === 0 ? "Free" : `$${item.price.toFixed(2)}`}
                          </div>
                          {item.price > 0 && <div className="text-xs text-gray-400">per unit</div>}
                          <div className="text-xs text-gray-500 mt-1 font-medium">
                            {item.quantity.toLocaleString()} avail.
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-semibold ${scoreBg}`}>
                          {scoreLabel} match
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleCard(item.item_id)}
                      className="w-full flex items-center justify-between gap-2 px-5 py-3 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors border-t border-gray-100 font-medium"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Recommendation
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-3 bg-emerald-50/60 border-t border-emerald-100">
                            <p className="text-sm text-gray-700 leading-relaxed">{item.recommendation_text}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {matches.length > 0 && (
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
  );
}
