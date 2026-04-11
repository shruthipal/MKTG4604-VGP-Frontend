import { useState, useEffect } from "react";
import { ShoppingCart, MapPin, Package, Search, MessageSquare, Send, RotateCcw } from "lucide-react";
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
    }
  }, []);

  // Save to localStorage whenever form changes
  useEffect(() => {
    const formData = { nonprofitName, goodsNeeded, location, quantity, budget };
    localStorage.setItem("nonprofitFormData", JSON.stringify(formData));
  }, [nonprofitName, goodsNeeded, location, quantity, budget]);

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;

    const input = chatInput.toLowerCase();

    // Extract organization name
    const orgPatterns = [
      /i'?m\s+(?:a\s+)?([a-zA-Z\s&]+?)(?:\s+and|,|\.|\s+how|\s+looking|$)/i,
      /we'?re\s+(?:a\s+)?([a-zA-Z\s&]+?)(?:\s+and|,|\.|\s+how|\s+looking|$)/i,
      /from\s+([a-zA-Z\s&]+?)(?:\s+and|,|\.|\s+how|\s+looking|$)/i,
    ];

    for (const pattern of orgPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].trim();
        if (extracted.length > 2 && !['food bank', 'nonprofit', 'reseller', 'buyer'].includes(extracted)) {
          setNonprofitName(extracted.charAt(0).toUpperCase() + extracted.slice(1));
          break;
        }
      }
    }

    // Extract quantity and goods needed
    const quantityPatterns = [
      /(?:need|looking for|want)\s+(\d+[,\d]*)\s+([a-zA-Z\s]+?)(?:\s+per|daily|weekly|monthly|$)/i,
      /(\d+[,\d]*)\s+([a-zA-Z\s]+?)(?:\s+needed|required)/i,
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
        /(?:need|looking for|want|get)\s+(?:some\s+)?(?:donated\s+)?([a-zA-Z\s,]+?)(?:\s+from|\?|$)/i,
        /(?:for|buy|purchase)\s+([a-zA-Z\s,]+?)(?:\s+from|\?|$)/i,
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

    // Extract location
    const locationPatterns = [
      /(?:in|from|at|near)\s+([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/,
      /(?:in|from|at|near)\s+([A-Z][a-zA-Z\s]+)/,
    ];

    for (const pattern of locationPatterns) {
      const match = chatInput.match(pattern);
      if (match && match[1]) {
        setLocation(match[1].trim());
        break;
      }
    }

    // Extract budget
    const budgetPattern = /(?:budget|pay|spend|up to)\s+\$(\d+[,\d]*(?:\.\d+)?[kKmM]?)/i;
    const budgetMatch = chatInput.match(budgetPattern);
    if (budgetMatch) {
      setBudget('$' + budgetMatch[1]);
    }

    setChatInput("");
  };

  const handleFindMatches = () => {
    // Matching logic based on goods needed keywords
    const goodsLower = goodsNeeded.toLowerCase();
    const locationLower = location.toLowerCase();

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
          <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-400 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h2 className="mb-2 text-teal-900 text-2xl font-bold">For Organizations in Need</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tell us what you need. We'll connect you with organizations that have surplus available.
          </p>
        </div>

        {/* Example */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-teal-900 mb-2">Example:</p>
          <p className="text-sm text-teal-800">
            "I'm a food bank in Portland looking for donated food and produce."
          </p>
        </div>

        {/* Chat Box */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-teal-700" />
            <h3 className="text-teal-900 font-semibold">Quick Input</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Describe what you need and we'll extract the details
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., I need electronics, laptops, or office furniture in California..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
              className="flex-1 px-4 py-3 bg-white border border-cyan-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button
              onClick={handleChatSubmit}
              disabled={!chatInput.trim()}
              className="px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-cyan-100 rounded-lg p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold text-teal-900 mb-4">Your Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                <ShoppingCart className="w-4 h-4 inline mr-2 text-teal-700" />
                Organization Name
              </label>
              <input
                type="text"
                placeholder="e.g., Local Food Bank, Tech Resale"
                value={nonprofitName}
                onChange={(e) => setNonprofitName(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  <Package className="w-4 h-4 inline mr-2 text-teal-700" />
                  What Do You Need?
                </label>
                <input
                  type="text"
                  placeholder="e.g., food, computers, clothing"
                  value={goodsNeeded}
                  onChange={(e) => setGoodsNeeded(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Quantity (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 200 daily, 500 units"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4 inline mr-2 text-teal-700" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Portland, OR"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Budget (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., $5,000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleFindMatches}
                disabled={!goodsNeeded.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-medium"
              >
                <Search className="w-5 h-5" />
                Find Available
              </button>
              {hasSearched && (
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700 font-medium"
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
            <div className="mb-6 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
              <h3 className="mb-2 text-teal-900 font-semibold">
                {matches.length > 0 ? "Available Sources" : "No Matches Found"}
              </h3>
              {matches.length > 0 ? (
                <p className="text-sm text-teal-800">
                  Found {matches.length} {matches.length === 1 ? "organization" : "organizations"} with available {goodsNeeded}
                </p>
              ) : (
                <p className="text-sm text-teal-800">
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
