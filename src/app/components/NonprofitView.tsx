import { useState, useEffect } from "react";
import { ShoppingCart, MapPin, Package, Search, MessageSquare, Send, RotateCcw, DollarSign, Tag } from "lucide-react";
import { motion } from "motion/react";
import CompanyMatchCard from "./CompanyMatchCard";
import { mockCompanies, Company } from "../data/mockData";

export default function NonprofitView() {
  const [nonprofitName, setNonprofitName] = useState("");
  const [goodsNeeded, setGoodsNeeded] = useState("");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState("");
  const [budget, setBudget] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [matches, setMatches] = useState<Company[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("nonprofitFormData");
    if (saved) {
      const data = JSON.parse(saved);
      setNonprofitName(data.nonprofitName || "");
      setGoodsNeeded(data.goodsNeeded || "");
      setLocation(data.location || "");
      setQuantity(data.quantity || "");
      setBudget(data.budget || "");
      setIsPurchasing(data.isPurchasing || false);
      setMinPrice(data.minPrice || "");
      setMaxPrice(data.maxPrice || "");
    }
  }, []);

  // Save to localStorage whenever form changes
  useEffect(() => {
    const formData = { nonprofitName, goodsNeeded, location, quantity, budget, isPurchasing, minPrice, maxPrice };
    localStorage.setItem("nonprofitFormData", JSON.stringify(formData));
  }, [nonprofitName, goodsNeeded, location, quantity, budget, isPurchasing, minPrice, maxPrice]);

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;

    const input = chatInput.toLowerCase();

    // Extract organization name
    const orgPatterns = [
      /i'?m\s+(?:from\s+|representing\s+|with\s+)?([a-zA-Z\s&]+?)(?:\s+and|,|\.|\s+looking|\s+need|$)/i,
      /we'?re\s+(?:from\s+|representing\s+|with\s+)?([a-zA-Z\s&]+?)(?:\s+and|,|\.|\s+looking|\s+need|$)/i,
      /(?:from|at)\s+([a-zA-Z\s&]+?)(?:\s+and|,|\.|\s+looking|\s+need|$)/i,
      /([a-zA-Z\s&]+?)\s+(?:needs|is looking|wants)/i,
    ];

    for (const pattern of orgPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].trim();
        if (extracted.length > 2 && !['food', 'clothing', 'electronics', 'computers', 'laptops', 'food bank', 'nonprofit'].includes(extracted)) {
          setNonprofitName(extracted.charAt(0).toUpperCase() + extracted.slice(1));
          break;
        }
      }
    }

    // Extract quantity and goods needed
    const quantityPatterns = [
      /(?:need|looking for|want|require)\s+(\d+[,\d]*)\s+([a-zA-Z\s]+?)(?:\s+per|daily|weekly|monthly|for|that|$)/i,
      /(\d+[,\d]*)\s+([a-zA-Z\s]+?)(?:\s+needed|required|wanted)/i,
      /(?:need|looking for|want)\s+(\d+[,\d]*)\s+([a-zA-Z\s]+?)(?:\s+to|for)/i,
    ];

    for (const pattern of quantityPatterns) {
      const match = input.match(pattern);
      if (match) {
        setQuantity(match[1]);
        if (match[2]) {
          setGoodsNeeded(match[2].trim());
        }
        break;
      }
    }

    // If no quantity pattern matched, try to extract just the goods
    if (!goodsNeeded) {
      const goodsPatterns = [
        /(?:need|looking for|want|require)\s+(?:some\s+|donated\s+)?([a-zA-Z\s,]+?)(?:\s+from|for|to|$)/i,
        /(?:seeking|searching for)\s+([a-zA-Z\s,]+?)(?:\s+from|for|to|$)/i,
        /(?:for|buy|purchase|get)\s+([a-zA-Z\s,]+?)(?:\s+from|for|to|$)/i,
      ];

      for (const pattern of goodsPatterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
          const goods = match[1].trim();
          if (goods.length > 2 && !goods.includes('how can')) {
            setGoodsNeeded(goods);
            break;
          }
        }
      }
    }

    // Extract location - improved patterns
    const locationPatterns = [
      /(?:in|from|at|near|located in|based in|serving)\s+([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/,
      /(?:in|from|at|near|located in|based in|serving)\s+([A-Z][a-zA-Z\s]+)/,
      /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})\s+(?:area|region|community)/,
    ];

    for (const pattern of locationPatterns) {
      const match = chatInput.match(pattern);
      if (match && match[1]) {
        setLocation(match[1].trim());
        break;
      }
    }

    // Extract budget - improved patterns
    const budgetPatterns = [
      /(?:budget|can spend|have|up to)\s+\$?(\d+[,\d]*(?:\.\d+)?[kKmM]?)/i,
      /\$(\d+[,\d]*(?:\.\d+)?[kKmM]?)\s+(?:budget|to spend|available)/i,
      /(?:pay|spend)\s+(?:up to\s+)?\$?(\d+[,\d]*(?:\.\d+)?[kKmM]?)/i,
    ];

    for (const pattern of budgetPatterns) {
      const match = chatInput.match(pattern);
      if (match && match[1]) {
        setBudget('$' + match[1]);
        break;
      }
    }

    setChatInput("");
  };

  const handleFindMatches = () => {
    // Matching logic based on goods needed keywords
    const goodsLower = goodsNeeded.toLowerCase();
    const locationLower = location.toLowerCase();
    const minPriceNum = minPrice ? parseFloat(minPrice) : 0;
    const maxPriceNum = maxPrice ? parseFloat(maxPrice) : Infinity;

    const filtered = mockCompanies.filter((company) => {
      // Check if company inventory matches what buyer needs
      const hasInventoryMatch = company.inventoryType.some((item) => {
        const itemLower = item.toLowerCase();
        return goodsLower.includes(itemLower) ||
               itemLower.includes(goodsLower) ||
               // Fuzzy matching for common terms
               (goodsLower.includes('food') && itemLower.includes('food')) ||
               (goodsLower.includes('computer') && (itemLower.includes('computer') || itemLower.includes('laptop') || itemLower.includes('electronics'))) ||
               (goodsLower.includes('laptop') && (itemLower.includes('laptop') || itemLower.includes('computer') || itemLower.includes('electronics'))) ||
               (goodsLower.includes('electronics') && itemLower.includes('electronics')) ||
               (goodsLower.includes('clothing') && itemLower.includes('clothing')) ||
               (goodsLower.includes('phone') && (itemLower.includes('phone') || itemLower.includes('smartphone'))) ||
               (goodsLower.includes('doughnut') && (itemLower.includes('doughnut') || itemLower.includes('baked goods'))) ||
               (goodsLower.includes('office') && (itemLower.includes('office') || itemLower.includes('desk') || itemLower.includes('chair')));
      });

      // Filter by price range if purchasing
      if (isPurchasing && hasInventoryMatch) {
        const companyValue = company.estimatedValue;
        return companyValue >= minPriceNum && companyValue <= maxPriceNum;
      }

      return hasInventoryMatch;
    });

    // Sort by location proximity and estimated value
    const sorted = filtered.sort((a, b) => {
      const aLocation = a.location.toLowerCase();
      const bLocation = b.location.toLowerCase();

      if (locationLower) {
        const aExactMatch = aLocation === locationLower;
        const bExactMatch = bLocation === locationLower;
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;

        const aSameState = locationLower.includes(',') && aLocation.split(',')[1]?.trim() === locationLower.split(',')[1]?.trim();
        const bSameState = locationLower.includes(',') && bLocation.split(',')[1]?.trim() === locationLower.split(',')[1]?.trim();
        if (aSameState && !bSameState) return -1;
        if (!aSameState && bSameState) return 1;
      }

      return 0;
    });

    setMatches(sorted);
    setHasSearched(true);
  };

  const handleReset = () => {
    setNonprofitName("");
    setGoodsNeeded("");
    setLocation("");
    setQuantity("");
    setBudget("");
    setMinPrice("");
    setMaxPrice("");
    setMatches([]);
    setHasSearched(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#E6F7F1] text-[#1F7A63] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h2 className="mb-2 text-[#1E293B] text-2xl font-bold">Find Available Surplus</h2>
          <p className="text-[#64748B] max-w-2xl mx-auto">
            Search for businesses with surplus inventory that matches your organization's needs, either for free donations or paid purchases.
          </p>
        </div>

        {/* Example */}
        <div className="bg-[#F2FBF7] border border-[#4CAF8E] rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-[#1F7A63] mb-2">Example:</p>
          <p className="text-sm text-[#1E293B]">
            "I'm a food bank in Portland looking for donated food and produce."
          </p>
        </div>

        {/* Chat Box */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-[#1F7A63]" />
            <h3 className="text-[#1E293B] font-semibold">Quick Input</h3>
          </div>
          <p className="text-sm text-[#64748B] mb-3">
            Describe your organization's needs in natural language and we'll automatically fill in the form fields below
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., I need electronics, laptops, or office furniture in California..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
              className="flex-1 px-4 py-3 bg-white border border-[#4CAF8E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF8E]"
            />
            <button
              onClick={handleChatSubmit}
              disabled={!chatInput.trim()}
              className="px-4 py-3 bg-[#1F7A63] text-white rounded-lg hover:bg-[#16664E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-emerald-100 rounded-lg p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1E293B] mb-6">Your Details</h3>
          <div className="space-y-6">
            {/* Organization Name */}
            <div>
              <label className="block mb-2 text-sm font-medium text-[#1E293B]">
                <ShoppingCart className="w-4 h-4 inline mr-2 text-[#1F7A63]" />
                Organization Name
              </label>
              <input
                type="text"
                placeholder="e.g., Local Food Bank, Tech Resale"
                value={nonprofitName}
                onChange={(e) => setNonprofitName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF8E] focus:border-transparent transition-colors"
              />
            </div>

            {/* Goods Needed and Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1E293B]">
                  <Package className="w-4 h-4 inline mr-2 text-[#1F7A63]" />
                  What Do You Need?
                </label>
                <input
                  type="text"
                  placeholder="e.g., food, computers, clothing"
                  value={goodsNeeded}
                  onChange={(e) => setGoodsNeeded(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF8E] focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1E293B]">
                  Quantity (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 200 daily, 500 units"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF8E] focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Location and Purchasing Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1E293B]">
                  <MapPin className="w-4 h-4 inline mr-2 text-[#1F7A63]" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Portland, OR"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF8E] focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1E293B]">
                  <Tag className="w-4 h-4 inline mr-2 text-[#1F7A63]" />
                  Type of Purchase
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsPurchasing(false)}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      !isPurchasing
                        ? "bg-[#1F7A63] text-white shadow-md"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => setIsPurchasing(true)}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      isPurchasing
                        ? "bg-[#1F7A63] text-white shadow-md"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Paying
                  </button>
                </div>
              </div>
            </div>

            {/* Price Range - Conditional */}
            {isPurchasing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-[#F2FBF7] border border-[#4CAF8E] rounded-lg p-4 space-y-4"
              >
                <p className="text-sm font-medium text-[#1F7A63]">Set your price range</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[#1E293B]">
                      <DollarSign className="w-4 h-4 inline mr-2 text-[#1F7A63]" />
                      Minimum Price
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 100"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#4CAF8E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF8E] focus:border-transparent transition-colors"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[#1E293B]">
                      <DollarSign className="w-4 h-4 inline mr-2 text-[#1F7A63]" />
                      Maximum Price
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 5000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#4CAF8E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF8E] focus:border-transparent transition-colors"
                      min="0"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Budget field - only show if not purchasing */}
            {!isPurchasing && (
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1E293B]">
                  Budget (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., $5,000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF8E] focus:border-transparent transition-colors"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleFindMatches}
                disabled={!goodsNeeded.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-medium hover:shadow-lg"
              >
                <Search className="w-5 h-5" />
                Find Available
              </button>
              {hasSearched && (
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700 font-medium hover:border-gray-400"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Search
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 p-4 bg-[#F2FBF7] border border-[#4CAF8E] rounded-lg">
              <h3 className="mb-2 text-[#1F7A63] font-semibold">
                {matches.length > 0 ? "Available Sources" : "No Matches Found"}
              </h3>
              {matches.length > 0 ? (
                <p className="text-sm text-[#1E293B]">
                  Found {matches.length} {matches.length === 1 ? "organization" : "organizations"} with available {goodsNeeded}
                </p>
              ) : (
                <p className="text-sm text-[#64748B]">
                  Try different items like "food", "electronics", "clothing", or "furniture".
                </p>
              )}
            </div>

            <div className="space-y-4">
              {matches.map((company, index) => (
                <CompanyMatchCard
                  key={company.id}
                  company={company}
                  nonprofitNeeds={goodsNeeded}
                  nonprofitName={nonprofitName}
                  nonprofitLocation={location}
                  rank={index + 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
