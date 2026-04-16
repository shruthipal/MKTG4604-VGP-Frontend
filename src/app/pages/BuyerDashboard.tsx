import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft, ShoppingBag,
  Zap, Mail,
} from "lucide-react";
import NonprofitView from "../components/NonprofitView";
import SignInGate from "../components/SignInGate";
import ResultDetailPanel from "../components/ResultDetailPanel";
import InboxPanel from "../components/InboxPanel";
import { RecommendationCard } from "../lib/api";

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

type BuyerTab = "find" | "inbox";

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

// ─── Buyer Dashboard ──────────────────────────────────────────────────────────

const STORAGE_KEY = "sc_buyer_auth";

function loadAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { token: string; email: string };
  } catch { return null; }
}

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BuyerTab>("find");

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
  const [selectedItem, setSelectedItem] = useState<RecommendationCard | null>(null);

  // Show sign-in gate first
  if (authState === "gate") {
    return (
      <SignInGate
        portalType="buyer"
        onGuest={() => setAuthState("guest")}
        onSignIn={(token, email) => signIn(token, email)}
      />
    );
  }

  const tabTitles: Record<BuyerTab, string> = {
    find: "Find Surplus",
    inbox: "Inbox",
  };

  const tabSubtitles: Record<BuyerTab, string> = {
    find: "Discover surplus inventory matched to your needs using AI.",
    inbox: "Interest messages and updates appear here.",
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Detail panel overlay */}
      {selectedItem && (
        <ResultDetailPanel
          type="item"
          item={selectedItem}
          userToken={userToken}
          userEmail={userEmail}
          userOrgName=""
          onClose={() => setSelectedItem(null)}
          onSignInRequired={() => {
            setSelectedItem(null);
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
                icon={<ShoppingBag className="w-4 h-4" />}
                label="Find Surplus"
                active={activeTab === "find"}
                onClick={() => setActiveTab("find")}
              />
              {authState === "signed-in" && (
                <NavItem
                  icon={<Mail className="w-4 h-4" />}
                  label="Inbox"
                  active={activeTab === "inbox"}
                  onClick={() => setActiveTab("inbox")}
                />
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
              {authState === "signed-in" ? "Signed In" : "Guest"} · Buyer Portal
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
              <NonprofitView onSelectItem={setSelectedItem} />
            </div>
          )}
          {activeTab === "inbox" && userToken && (
            <InboxPanel
              token={userToken}
              userEmail={userEmail}
              emptyMessage="No messages yet. Interest from businesses will appear here."
            />
          )}
        </motion.div>
      </main>
    </div>
  );
}
