import { useState, useEffect } from "react";
import { Building2, MapPin, Package, DollarSign, Search, MessageSquare, Send, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import NonprofitMatchCard from "./NonprofitMatchCard";
import { mockNonprofits, Nonprofit } from "../data/mockData";

export default function BusinessView() {
  const [companyName, setCompanyName] = useState("");
  const [inventory, setInventory] = useState("");
  const [location, setLocation] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [matches, setMatches] = useState<Nonprofit[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("businessFormData");
    if (saved) {
      const data = JSON.parse(saved);
      setCompanyName(data.companyName || "");
      setInventory(data.inventory || "");
      setLocation(data.location || "");
      setEstimatedValue(data.estimatedValue || "");
      setQuantity(data.quantity || "");
    }
  }, []);

  // Save to localStorage whenever form changes
  useEffect(() => {
    const formData = { companyName, inventory, location, estimatedValue, quantity };
    localStorage.setItem("businessFormData", JSON.stringify(formData));
  }, [companyName, inventory, location, estimatedValue, quantity]);

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;

    const input = chatInput.toLowerCase();

    // Extract company name
    const companyPatterns = [
      /i'?m\s+(?:from\s+|representing\s+)?([a-zA-Z\s&]+?)(?:\s+and|,|\.|$)/i,
      /we'?re\s+(?:from\s+|representing\s+)?([a-zA-Z\s&]+?)(?:\s+and|,|\.|$)/i,
      /(?:from|at)\s+([a-zA-Z\s&]+?)(?:\s+and|,|\.|$)/i,
      /([a-zA-Z\s&]+?)\s+(?:has|have|is providing)/i,
    ];

    for (const pattern of companyPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].trim();
        if (extracted.length > 2 && !['food', 'clothing', 'electronics', 'computers', 'laptops'].includes(extracted)) {
          setCompanyName(extracted.charAt(0).toUpperCase() + extracted.slice(1));
          break;
        }
      }
    }

    // Extract quantity and inventory
    const quantityPatterns = [
      /(\d+[,\d]*)\s+(?:extra|excess|surplus)?\s*([a-zA-Z\s]+?)(?:\s+every\s+day|daily|per day|a day|available|in stock)/i,
      /(?:have|has)\s+(\d+[,\d]*)\s+([a-zA-Z\s]+?)(?:\s+available|in stock|to donate|to give)/i,
      /(\d+[,\d]*)\s+([a-zA-Z\s]+?)(?:\s+that|which)/i,
    ];

    for (const pattern of quantityPatterns) {
      const match = input.match(pattern);
      if (match) {
        setQuantity(match[1]);
        if (match[2]) {
          setInventory(match[2].trim());
        }
        break;
      }
    }

    // If no quantity pattern matched, try to extract just the inventory
    if (!inventory) {
      const inventoryPatterns = [
        /(?:extra|excess|surplus|donate|give away)\s+([a-zA-Z\s,]+?)(?:\s+to|for|that|$)/i,
        /(?:have|has)\s+(?:some\s+)?([a-zA-Z\s,]+?)(?:\s+to|for|that|$)/i,
        /(?:providing|offering)\s+([a-zA-Z\s,]+?)(?:\s+to|for|that|$)/i,
      ];

      for (const pattern of inventoryPatterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
          setInventory(match[1].trim());
          break;
        }
      }
    }

    // Extract location
    const locationPatterns = [
      /(?:in|from|at|located in|based in)\s+([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/,
      /(?:in|from|at|located in|based in)\s+([A-Z][a-zA-Z\s]+)/,
      /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})\s+(?:area|region)/,
    ];

    for (const pattern of locationPatterns) {
      const match = chatInput.match(pattern);
      if (match && match[1]) {
        setLocation(match[1].trim());
        break;
      }
    }

    // Extract value
    const valuePatterns = [
      /(?:valued at|worth|estimated value of|cost|price)\s+\$?(\d+[,\d]*(?:\.\d+)?[kKmM]?)/i,
      /\$(\d+[,\d]*(?:\.\d+)?[kKmM]?)\s+(?:value|worth|estimated)/i,
      /\$(\d+[,\d]*(?:\.\d+)?[kKmM]?)/,
    ];

    for (const pattern of valuePatterns) {
      const match = chatInput.match(pattern);
      if (match && match[1]) {
        setEstimatedValue('$' + match[1]);
        break;
      }
    }

    setChatInput("");
  };

  const handleFindMatches = () => {
    // Matching logic based on inventory keywords
    const inventoryLower = inventory.toLowerCase();
    const locationLower = location.toLowerCase();

    const filtered = mockNonprofits.filter((nonprofit) => {
      // Check if inventory matches any goods needed
      const hasInventoryMatch = nonprofit.goodsNeeded.some((good) => {
        const goodLower = good.toLowerCase();
        return inventoryLower.includes(goodLower) ||
               goodLower.includes(inventoryLower) ||
               // Fuzzy matching for common terms
               (inventoryLower.includes('food') && goodLower.includes('food')) ||
               (inventoryLower.includes('computer') && (goodLower.includes('computer') || goodLower.includes('laptop') || goodLower.includes('electronics'))) ||
               (inventoryLower.includes('laptop') && (goodLower.includes('laptop') || goodLower.includes('computer') || goodLower.includes('electronics'))) ||
               (inventoryLower.includes('electronics') && goodLower.includes('electronics')) ||
               (inventoryLower.includes('clothing') && goodLower.includes('clothing')) ||
               (inventoryLower.includes('phone') && (goodLower.includes('phone') || goodLower.includes('smartphone')));
      });

      return hasInventoryMatch;
    });

    // Sort by location proximity (same city/state gets priority)
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
    setCompanyName("");
    setInventory("");
    setLocation("");
    setEstimatedValue("");
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
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="mb-2 text-[#1E293B] text-2xl font-bold">List Your Surplus</h2>
          <p className="text-[#64748B] max-w-2xl mx-auto">
            Share your excess inventory and we'll match you with organizations that can use it, creating positive impact while optimizing your resources.
          </p>
        </div>

        {/* Example */}
        <div className="bg-[#F2FBF7] border border-[#4CAF8E] rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-[#1F7A63] mb-2">Example:</p>
          <p className="text-sm text-[#1E293B]">
            "I'm Dunkin' and I have 500 extra doughnuts every day in Boston, MA."
          </p>
        </div>

        {/* Chat Box */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-[#1F7A63]" />
            <h3 className="text-[#1E293B] font-semibold">Quick Input</h3>
          </div>
          <p className="text-sm text-[#64748B] mb-3">
            Describe your surplus in natural language and we'll automatically fill in the details below
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., I have 500 laptops available in California..."
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
          <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Surplus Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-[#1E293B]">
                <Building2 className="w-4 h-4 inline mr-2 text-[#1F7A63]" />
                Organization Name
              </label>
              <input
                type="text"
                placeholder="e.g., ABC Corp, Local Bakery"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF8E] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1E293B]">
                  <Package className="w-4 h-4 inline mr-2 text-[#1F7A63]" />
                  Item Available
                </label>
                <input
                  type="text"
                  placeholder="e.g., doughnuts, laptops, clothing"
                  value={inventory}
                  onChange={(e) => setInventory(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF8E] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1E293B]">
                  Quantity
                </label>
                <input
                  type="text"
                  placeholder="e.g., 500 daily, 1000 units"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF8E] focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1E293B]">
                  <MapPin className="w-4 h-4 inline mr-2 text-[#1F7A63]" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Boston, MA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF8E] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-[#1E293B]">
                  <DollarSign className="w-4 h-4 inline mr-2 text-[#1F7A63]" />
                  Estimated Value (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., $5,000"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF8E] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleFindMatches}
                disabled={!inventory.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-medium"
              >
                <Search className="w-5 h-5" />
                Find Matches
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
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <h3 className="mb-2 text-emerald-900 font-semibold">
                {matches.length > 0 ? "Matching Recipients" : "No Matches Found"}
              </h3>
              {matches.length > 0 ? (
                <p className="text-sm text-emerald-800">
                  Found {matches.length} {matches.length === 1 ? "organization" : "organizations"} that can use {inventory}
                </p>
              ) : (
                <p className="text-sm text-emerald-800">
                  Try different items like "food", "electronics", "clothing", or "furniture".
                </p>
              )}
            </div>

            <div className="space-y-4">
              {matches.map((nonprofit, index) => (
                <NonprofitMatchCard
                  key={nonprofit.id}
                  nonprofit={nonprofit}
                  businessInventory={inventory}
                  businessName={companyName}
                  businessLocation={location}
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
