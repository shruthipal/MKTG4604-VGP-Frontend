import { useState, useEffect } from "react";
import {
  ShoppingCart, MapPin, Package, Search, MessageSquare, Send,
  DollarSign, Tag, Loader2, AlertCircle, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { fetchMatches, RecommendationCard } from "../lib/api";

export default function NonprofitView() {
  const [nonprofitName, setNonprofitName] = useState("");
  const [goodsNeeded, setGoodsNeeded] = useState("");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState("");
  const [budget, setBudget] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [matches, setMatches] = useState<RecommendationCard[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("nonprofitFormData");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setNonprofitName(data.nonprofitName || "");
        setGoodsNeeded(data.goodsNeeded || "");
        setLocation(data.location || "");
        setQuantity(data.quantity || "");
        setBudget(data.budget || "");
        setIsPurchasing(data.isPurchasing || false);
        setMinPrice(data.minPrice || "");
        setMaxPrice(data.maxPrice || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    const formData = { nonprofitName, goodsNeeded, location, quantity, budget, isPurchasing, minPrice, maxPrice };
    localStorage.setItem("nonprofitFormData", JSON.stringify(formData));
  }, [nonprofitName, goodsNeeded, location, quantity, budget, isPurchasing, minPrice, maxPrice]);

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    const input = chatInput.toLowerCase();

    const orgPatterns = [
      /i'?m\s+(?:a\s+)?([a-zA-Z\s&]+?)(?:\s+and|,|\.|\s+how|\s+looking|$)/i,
      /we'?re\s+(?:a\s+)?([a-zA-Z\s&]+?)(?:\s+and|,|\.|\s+how|\s+looking|$)/i,
      /from\s+([a-zA-Z\s&]+?)(?:\s+and|,|\.|\s+how|\s+looking|$)/i,
    ];
    for (const pattern of orgPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].trim();
        if (extracted.length > 2 && !["food bank", "nonprofit", "reseller", "buyer"].includes(extracted)) {
          setNonprofitName(extracted.charAt(0).toUpperCase() + extracted.slice(1));
          break;
        }
      }
    }

    const quantityPatterns = [
      /(?:need|looking for|want)\s+(\d+[,\d]*)\s+([a-zA-Z\s]+?)(?:\s+per|daily|weekly|monthly|$)/i,
      /(\d+[,\d]*)\s+([a-zA-Z\s]+?)(?:\s+needed|required)/i,
    ];
    for (const pattern of quantityPatterns) {
      const match = input.match(pattern);
      if (match) {
        setQuantity(match[1]);
        if (match[2]) setGoodsNeeded(match[2].trim());
        break;
      }
    }

    if (!goodsNeeded) {
      const goodsPatterns = [
        /(?:need|looking for|want|get)\s+(?:some\s+)?(?:donated\s+)?([a-zA-Z\s,]+?)(?:\s+from|\?|$)/i,
        /(?:for|buy|purchase)\s+([a-zA-Z\s,]+?)(?:\s+from|\?|$)/i,
      ];
      for (const pattern of goodsPatterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
          const goods = match[1].trim();
          if (goods.length > 2 && !goods.includes("how can")) { setGoodsNeeded(goods); break; }
        }
      }
    }

    const locationPatterns = [
      /(?:in|from|at|near)\s+([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/,
      /(?:in|from|at|near)\s+([A-Z][a-zA-Z\s]+)/,
    ];
    for (const pattern of locationPatterns) {
      const match = chatInput.match(pattern);
      if (match && match[1]) { setLocation(match[1].trim()); break; }
    }

    const budgetMatch = chatInput.match(/(?:budget|pay|spend|up to)\s+\$(\d+[,\d]*(?:\.\d+)?[kKmM]?)/i);
    if (budgetMatch) setBudget("$" + budgetMatch[1]);

    setChatInput("");
  };

  const handleFindMatches = async () => {
    if (!goodsNeeded.trim() || isLoading) return;
    setIsLoading(true);
    setApiError(null);
    setExpandedCards(new Set());
    try {
      const response = await fetchMatches(goodsNeeded);
      setMatches(response.recommendations);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Search failed");
      setMatches([]);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };

  const toggleCard = (itemId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  };

  const handleClearResults = () => {
    setMatches([]);
    setHasSearched(false);
    setApiError(null);
    setExpandedCards(new Set());
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h2 className="mb-2 text-gray-900 text-2xl font-bold">I'm a Buyer</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
            Tell us what you need and we'll connect you with the closest businesses that have that surplus available
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Example</p>
          <p className="text-sm text-gray-700 italic">
            "I'm a food bank in Portland looking for food and produce that can be donated."
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-800">Quick Input</span>
            <span className="text-xs text-gray-400">— we'll extract the details</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., I need electronics, laptops, or office furniture in California..."
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

        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-5">Your Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Organization Name
              </label>
              <input
                type="text"
                placeholder="e.g., Local Food Bank, Tech Resale"
                value={nonprofitName}
                onChange={(e) => setNonprofitName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <Package className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                  What Do You Need?
                </label>
                <input
                  type="text"
                  placeholder="e.g., food, computers, clothing"
                  value={goodsNeeded}
                  onChange={(e) => setGoodsNeeded(e.target.value)}
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
                  placeholder="e.g., 200 daily, 500 units"
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
                  placeholder="e.g., Portland, OR"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <Tag className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                  Type of Purchase
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPurchasing(false)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      !isPurchasing
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => setIsPurchasing(true)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      isPurchasing
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Paying
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isPurchasing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-emerald-700 mb-3">Price range</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 text-xs text-gray-600">
                          <DollarSign className="w-3 h-3 inline mr-0.5" />Min
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-xs text-gray-600">
                          <DollarSign className="w-3 h-3 inline mr-0.5" />Max
                        </label>
                        <input
                          type="number"
                          placeholder="5000"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {!isPurchasing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Budget <span className="font-normal text-gray-400 normal-case">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., $5,000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={handleFindMatches}
                disabled={!goodsNeeded.trim() || isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 active:bg-emerald-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-semibold text-sm"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Searching…</>
                ) : (
                  <><Search className="w-4 h-4" />Find Available</>
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

        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Search failed</p>
              <p className="text-sm text-red-600 mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        {hasSearched && !apiError && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {matches.length > 0 ? `Found ${matches.length} source${matches.length !== 1 ? "s" : ""}` : "No matches found"}
                </h3>
                {matches.length > 0 && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    Showing best matches for <span className="font-medium text-gray-700">"{goodsNeeded}"</span>
                  </p>
                )}
              </div>
              {matches.length === 0 && (
                <p className="text-sm text-gray-500 max-w-xs text-right">
                  Try "food", "electronics", "clothing", or "furniture"
                </p>
              )}
            </div>

            <div className="space-y-3">
              {matches.map((card, index) => {
                const isExpanded = expandedCards.has(card.item_id);
                const score = card.composite_score;
                const scoreLabel = score >= 0.75 ? "Strong" : score >= 0.5 ? "Good" : "Moderate";
                const scoreBg =
                  score >= 0.75 ? "bg-emerald-100 text-emerald-800" :
                  score >= 0.5  ? "bg-blue-100 text-blue-800" :
                                  "bg-amber-100 text-amber-800";

                return (
                  <motion.div
                    key={card.item_id}
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
                            <h4 className="font-semibold text-gray-900 text-sm leading-snug">{card.title}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 font-medium">
                                {card.category}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                                {card.condition}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-emerald-700 leading-tight">
                            {card.price === 0 ? "Free" : `$${card.price.toFixed(2)}`}
                          </div>
                          {card.price > 0 && <div className="text-xs text-gray-400">per unit</div>}
                          <div className="text-xs text-gray-500 mt-1 font-medium">
                            {card.quantity.toLocaleString()} avail.
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
                      onClick={() => toggleCard(card.item_id)}
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
                            <p className="text-sm text-gray-700 leading-relaxed">{card.recommendation_text}</p>
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
                  Need something different?{" "}
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
