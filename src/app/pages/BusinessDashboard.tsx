import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft, Search, Plus, Upload,
  Zap, Loader2, CheckCircle, AlertCircle, X, Mail,
} from "lucide-react";
import BusinessView from "../components/BusinessView";
import SignInGate from "../components/SignInGate";
import ResultDetailPanel from "../components/ResultDetailPanel";
import InboxPanel from "../components/InboxPanel";
import {
  getRetailerToken, uploadInventoryItem, getOwnInventory,
  BuyerInterestCard, InventoryItem,
} from "../lib/api";

// ─── Constants ───────────────────────────────────────────────────────────────

const CONDITIONS = ["new", "like_new", "good", "fair"];
const CATEGORIES = [
  "Food & Beverage", "Baked Goods", "Produce", "Dairy", "Beverages",
  "Canned Goods", "Prepared Foods", "Packaged Groceries", "Bulk Dry Goods",
  "Makeup & Cosmetics", "Beauty & Skincare", "Beauty & Hair Care",
  "Men's Clothing", "Women's Clothing", "Men's Athletic Apparel",
  "Women's Athletic Apparel", "Men's Outerwear", "Men's Footwear",
  "Women's Footwear", "Men's Grooming", "Men's Underwear & Basics",
  "Apparel", "Home Goods", "Electronics", "Office Supplies",
  "Outdoor & Sporting Goods", "Health & Wellness", "Other",
];

const TEMPLATE_CSV = `title,category,quantity,price,condition,expiry_date,description,location
Surplus Assorted Donuts,Food & Beverage,200,1.50,good,2025-12-31,Fresh donuts from morning run,Boston MA
Surplus Women's Tops,Women's Clothing,100,8.00,new,2026-06-30,Mixed sizes new with tags,Boston MA`;

// ─── Inventory History ────────────────────────────────────────────────────────

function InventoryHistory({ token, refreshKey }: { token: string; refreshKey: number }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getOwnInventory(token)
      .then((data) => setItems(data.slice().reverse())) // newest first
      .catch(() => setError("Could not load inventory history"))
      .finally(() => setLoading(false));
  }, [token, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 py-4">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-6 text-center">
        No inventory items yet. Add your first item above.
      </p>
    );
  }

  return (
    <div className="space-y-2 mt-2">
      {items.map((item) => {
        const statusColor =
          item.status === "active"
            ? "bg-emerald-100 text-emerald-700"
            : item.status === "sold"
            ? "bg-gray-100 text-gray-500"
            : "bg-red-100 text-red-600";
        return (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {item.category} · {item.quantity.toLocaleString()} units ·{" "}
                {item.price === 0 ? "Free" : `$${item.price.toFixed(2)}/unit`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor}`}>
                {item.status}
              </span>
              <span className="text-xs text-gray-400 capitalize">
                {item.condition.replace("_", " ")}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Add Item Panel ───────────────────────────────────────────────────────────

function AddItemPanel({ preToken }: { preToken?: string | null }) {
  const [step, setStep] = useState<"auth" | "item" | "done">(preToken ? "item" : "auth");
  const [retailerToken, setRetailerToken] = useState(preToken || "");
  const [refreshKey, setRefreshKey] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food & Beverage");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("good");
  const [expiryDate, setExpiryDate] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [submitError, setSubmitError] = useState("");

  const handleAuth = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    setAuthError("");
    try {
      const token = await getRetailerToken(email, password);
      setRetailerToken(token);
      setStep("item");
    } catch {
      setAuthError("Invalid retailer credentials. Make sure your account is registered as a business.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !quantity || !expiryDate) return;
    setIsLoading(true);
    setSubmitError("");
    try {
      await uploadInventoryItem(retailerToken, {
        title,
        category,
        quantity: parseInt(quantity),
        price: parseFloat(price) || 0,
        condition,
        expiry_date: new Date(expiryDate).toISOString(),
        description: description || undefined,
        location: location || undefined,
      });
      setStep("done");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = () => {
    setStep(preToken ? "item" : "auth");
    setEmail(""); setPassword("");
    if (!preToken) setRetailerToken("");
    setAuthError(""); setTitle(""); setCategory("Food & Beverage");
    setQuantity(""); setPrice(""); setCondition("good");
    setExpiryDate(""); setDescription(""); setLocation(""); setSubmitError("");
  };

  return (
    <div className="py-8 px-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Add Inventory Item</h2>
          <p className="text-sm text-gray-500 mb-6">
            {step === "auth" ? "Sign in with your business account to add inventory." : step === "item" ? "Fill in the details for your surplus item." : ""}
          </p>

          {step === "auth" && (
            <div className="space-y-4">
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Business Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                  placeholder="e.g., dunkin@demo.com"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
                />
              </div>
              {authError && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {authError}
                </div>
              )}
              <button
                onClick={handleAuth}
                disabled={!email || !password || isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : "Continue"}
              </button>
            </div>
          )}

          {step === "item" && (
            <div className="space-y-4">
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Item Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Surplus Dunkin Donuts — Assorted"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Condition *</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
                  >
                    {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Quantity *</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g., 500"
                    min="1"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Price / unit ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00 = free"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Expiry / Available Until *</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Boston, MA"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the item, ideal buyer, condition details…"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all resize-none"
                />
              </div>
              {submitError && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {submitError}
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={!title || !quantity || !expiryDate || isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : "Add Item"}
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-6">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 text-lg mb-1">Item Added!</h3>
              <p className="text-sm text-gray-500 mb-6">Your inventory item is now live and visible to buyers.</p>
              <button
                onClick={resetAll}
                className="px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-all"
              >
                Add Another Item
              </button>
            </div>
          )}
        </div>

        {/* ── History ── */}
        {retailerToken && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Your Inventory</h3>
            <InventoryHistory token={retailerToken} refreshKey={refreshKey} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bulk Upload Panel ────────────────────────────────────────────────────────

interface RowResult {
  row: number;
  title: string;
  status: "ok" | "error";
  message?: string;
}

function BulkUploadPanel({ preToken }: { preToken?: string | null }) {
  const [step, setStep] = useState<"auth" | "upload" | "done">(preToken ? "upload" : "auth");
  const [retailerToken, setRetailerToken] = useState(preToken || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [results, setResults] = useState<RowResult[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAuth = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    setAuthError("");
    try {
      const token = await getRetailerToken(email, password);
      setRetailerToken(token);
      setStep("upload");
    } catch {
      setAuthError("Invalid retailer credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText((ev.target?.result as string) ?? "");
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s/g, "_"));
    return lines.slice(1).map((line, i) => {
      const values = line.split(",");
      const row: Record<string, string> = {};
      header.forEach((h, j) => { row[h] = (values[j] ?? "").trim().replace(/^"|"$/g, ""); });
      return { rowNum: i + 2, data: row };
    });
  };

  const handleUpload = async () => {
    if (!csvText.trim()) return;
    setIsLoading(true);
    setSubmitError("");
    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      setSubmitError("No valid rows found. Check your CSV format.");
      setIsLoading(false);
      return;
    }
    const rowResults: RowResult[] = [];
    for (const { rowNum, data } of rows) {
      const title = data.title || data.item_title || "";
      if (!title) {
        rowResults.push({ row: rowNum, title: "(missing title)", status: "error", message: "Title is required" });
        continue;
      }
      try {
        const expiryRaw = data.expiry_date || data.expiry || "";
        const expiryIso = expiryRaw
          ? new Date(expiryRaw).toISOString()
          : new Date(Date.now() + 90 * 86400000).toISOString();
        await uploadInventoryItem(retailerToken, {
          title,
          category: data.category || "Other",
          quantity: parseInt(data.quantity) || 1,
          price: parseFloat(data.price) || 0,
          condition: data.condition || "good",
          expiry_date: expiryIso,
          description: data.description || undefined,
          location: data.location || undefined,
        });
        rowResults.push({ row: rowNum, title, status: "ok" });
      } catch (err) {
        rowResults.push({ row: rowNum, title, status: "error", message: err instanceof Error ? err.message : "Upload failed" });
      }
    }
    setResults(rowResults);
    setStep("done");
    setRefreshKey((k) => k + 1);
    setIsLoading(false);
  };

  const successCount = results.filter((r) => r.status === "ok").length;
  const failCount = results.filter((r) => r.status === "error").length;

  const resetAll = () => {
    setStep(preToken ? "upload" : "auth");
    setEmail(""); setPassword("");
    if (!preToken) setRetailerToken("");
    setAuthError(""); setCsvText(""); setResults([]); setSubmitError("");
  };

  return (
    <div className="py-8 px-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Bulk Upload Inventory</h2>
          <p className="text-sm text-gray-500 mb-6">
            {step === "auth"
              ? "Sign in with your business account to bulk upload inventory."
              : step === "upload"
              ? "Upload a CSV file or paste CSV data below."
              : ""}
          </p>

          {step === "auth" && (
            <div className="space-y-4">
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Business Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                  placeholder="e.g., dunkin@demo.com"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
                />
              </div>
              {authError && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {authError}
                </div>
              )}
              <button
                onClick={handleAuth}
                disabled={!email || !password || isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : "Continue"}
              </button>
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-emerald-700 mb-1">CSV Format</p>
                <p className="text-xs text-gray-600 font-mono leading-relaxed">
                  title, category, quantity, price, condition, expiry_date, description, location
                </p>
                <button
                  onClick={() => setCsvText(TEMPLATE_CSV)}
                  className="mt-2 text-xs text-emerald-700 font-semibold hover:underline"
                >
                  Load example template
                </button>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Upload CSV File</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer text-sm text-gray-500"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  Click to upload .csv file
                </div>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Or Paste CSV</label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={"title,category,quantity,price,condition,expiry_date\nDonut Surplus,Food & Beverage,200,1.50,good,2025-12-31"}
                  rows={6}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all resize-none"
                />
              </div>
              {submitError && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {submitError}
                </div>
              )}
              <button
                onClick={handleUpload}
                disabled={!csvText.trim() || isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : "Upload All Items"}
              </button>
            </div>
          )}

          {step === "done" && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <CheckCircle className="w-10 h-10 text-emerald-500 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900">Upload Complete</h3>
                  <p className="text-sm text-gray-500">{successCount} added · {failCount} failed</p>
                </div>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto mb-5">
                {results.map((r) => (
                  <div
                    key={r.row}
                    className={`flex items-start gap-2 text-sm p-2.5 rounded-lg ${r.status === "ok" ? "bg-emerald-50" : "bg-red-50"}`}
                  >
                    {r.status === "ok"
                      ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      : <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                    <span className={r.status === "ok" ? "text-emerald-800" : "text-red-700"}>
                      Row {r.row}: {r.title}{r.message ? ` — ${r.message}` : ""}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={resetAll}
                className="w-full py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-all"
              >
                Upload More
              </button>
            </div>
          )}
        </div>

        {/* ── History ── */}
        {retailerToken && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Your Inventory</h3>
            <InventoryHistory token={retailerToken} refreshKey={refreshKey} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

type BusinessTab = "find" | "add" | "upload" | "inbox";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/20"
          : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
      }`}
    >
      <span className={active ? "text-emerald-400" : "text-gray-500"}>{icon}</span>
      {label}
    </button>
  );
}

// ─── Business Dashboard ───────────────────────────────────────────────────────

const STORAGE_KEY = "sc_business_auth";

function loadAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { token: string; email: string };
  } catch { return null; }
}

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BusinessTab>("find");

  // Auth / gate state — restored from localStorage on mount
  const saved = loadAuth();
  const [authState, setAuthState] = useState<"gate" | "guest" | "signed-in">(
    saved ? "signed-in" : "gate"
  );
  const [userToken, setUserToken] = useState<string | null>(saved?.token ?? null);
  const [userEmail, setUserEmail] = useState(saved?.email ?? "");

  const signIn = (token: string, email: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, email }));
    setUserToken(token);
    setUserEmail(email);
    setAuthState("signed-in");
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserToken(null);
    setUserEmail("");
    setAuthState("gate");
  };

  // Detail panel state
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerInterestCard | null>(null);

  // Show sign-in gate first
  if (authState === "gate") {
    return (
      <SignInGate
        portalType="business"
        onGuest={() => setAuthState("guest")}
        onSignIn={(token, email) => signIn(token, email)}
      />
    );
  }

  const tabTitles: Record<BusinessTab, string> = {
    find: "Find Buyers",
    add: "Add Inventory Item",
    upload: "Bulk Upload Inventory",
    inbox: "Inbox",
  };

  const tabSubtitles: Record<BusinessTab, string> = {
    find: "Search for buyers matched to your inventory using AI.",
    add: "List a single surplus item for buyers to discover.",
    upload: "Upload multiple inventory items at once via CSV.",
    inbox: "Interest messages from buyers appear here.",
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Detail panel overlay */}
      {selectedBuyer && (
        <ResultDetailPanel
          type="buyer"
          buyer={selectedBuyer}
          userToken={userToken}
          userEmail={userEmail}
          userOrgName=""
          onClose={() => setSelectedBuyer(null)}
          onSignInRequired={() => {
            setSelectedBuyer(null);
            setAuthState("gate");
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className="flex flex-col h-screen overflow-hidden flex-shrink-0"
        style={{ width: 256, backgroundColor: "#0B1F16" }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-400 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5 text-[#0B1F16]" fill="currentColor" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight">Surplus Connect</span>
          </div>
        </div>

        {/* Back button */}
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5 w-full"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest px-3 mb-2">Main</p>
            <div className="space-y-1">
              <NavItem
                icon={<Search className="w-4 h-4" />}
                label="Find Buyers"
                active={activeTab === "find"}
                onClick={() => setActiveTab("find")}
              />
              {authState === "signed-in" && (
                <>
                  <NavItem
                    icon={<Plus className="w-4 h-4" />}
                    label="Add Inventory"
                    active={activeTab === "add"}
                    onClick={() => setActiveTab("add")}
                  />
                  <NavItem
                    icon={<Upload className="w-4 h-4" />}
                    label="Bulk Upload"
                    active={activeTab === "upload"}
                    onClick={() => setActiveTab("upload")}
                  />
                  <NavItem
                    icon={<Mail className="w-4 h-4" />}
                    label="Inbox"
                    active={activeTab === "inbox"}
                    onClick={() => setActiveTab("inbox")}
                  />
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Bottom badge */}
        <div className="px-5 py-4 border-t border-white/8 space-y-2">
          {authState === "signed-in" && userEmail && (
            <p className="text-xs text-gray-500 truncate text-center">{userEmail}</p>
          )}
          <div className="px-3 py-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-center">
            <span className="text-xs font-semibold text-emerald-400">
              {authState === "signed-in" ? "Signed In" : "Guest"} · Business Portal
            </span>
          </div>
          {authState === "signed-in" && (
            <button
              onClick={signOut}
              className="w-full text-xs text-gray-500 hover:text-red-400 transition-colors py-1"
            >
              Sign out
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{tabTitles[activeTab]}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{tabSubtitles[activeTab]}</p>
          </div>
          <div className="flex items-center gap-3">
            {authState === "guest" && (
              <button
                onClick={() => setAuthState("gate")}
                className="px-3 py-1.5 rounded-full border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50 transition-all"
              >
                Sign In
              </button>
            )}
            <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              AI-Powered
            </div>
          </div>
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "find" && (
            <div className="p-8">
              <BusinessView onSelectBuyer={setSelectedBuyer} />
            </div>
          )}
          {activeTab === "add" && <AddItemPanel preToken={userToken} />}
          {activeTab === "upload" && <BulkUploadPanel preToken={userToken} />}

          {activeTab === "inbox" && userToken && (
            <InboxPanel
              token={userToken}
              userEmail={userEmail}
              emptyMessage="No messages yet. Interest from buyers will appear here."
            />
          )}
        </motion.div>
      </main>
    </div>
  );
}
