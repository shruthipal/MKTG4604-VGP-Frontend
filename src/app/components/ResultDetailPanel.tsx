import { useState } from "react";
import { motion } from "motion/react";
import {
  X, CheckCircle, Loader2, Mail, MapPin, Tag,
  Heart, Briefcase, Users, Package, DollarSign, Star,
} from "lucide-react";
import { expressInterest, InterestPayload } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemData {
  item_id: string;
  title: string;
  category: string;
  price: number;
  quantity: number;
  condition: string;
  retailer_id: string;
  similarity_score: number;
  composite_score: number;
  recommendation_text: string;
  retailer_email?: string;
  retailer_name?: string;
}

interface BuyerData {
  org_name: string;
  segment: string;
  location: string | null;
  wants: string;
  preferences: string[];
  match_strength: string;
  contact_email?: string;
  user_id?: string;
}

interface Props {
  type: "item" | "buyer";
  item?: ItemData;
  buyer?: BuyerData;
  userToken: string | null;
  userEmail: string;
  userOrgName: string;
  onClose: () => void;
  onSignInRequired: () => void;
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: "emerald" | "blue";
}) {
  const pct = Math.min(Math.max(score * 100, 0), 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-600 font-medium">{label}</span>
        <span className="text-xs font-semibold text-gray-800">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            color === "emerald" ? "bg-emerald-500" : "bg-blue-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Score Label Badge ────────────────────────────────────────────────────────

function ScoreBadge({ label }: { label: string }) {
  const color =
    label === "Strong"
      ? "bg-emerald-100 text-emerald-700"
      : label === "Good"
      ? "bg-blue-100 text-blue-700"
      : "bg-amber-100 text-amber-700";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      <Star className="w-3 h-3" />
      {label} Match
    </span>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 border-y border-emerald-100">
      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{children}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResultDetailPanel({
  type,
  item,
  buyer,
  userToken,
  userEmail,
  userOrgName,
  onClose,
  onSignInRequired,
}: Props) {
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  // Derived values
  const title = type === "item" ? item?.title ?? "" : buyer?.org_name ?? "";
  const subtitle =
    type === "item" ? item?.category ?? "" : buyer?.segment ?? "";

  const compositeScore =
    type === "item" ? (item?.composite_score ?? 0) : 0;
  const matchStrengthLabel =
    type === "buyer"
      ? (buyer?.match_strength ?? "Moderate")
      : compositeScore >= 0.75
      ? "Strong"
      : compositeScore >= 0.5
      ? "Good"
      : "Moderate";

  const handleExpressInterest = async () => {
    if (!userToken) return;
    setSending(true);
    setSendError("");
    try {
      const payload: InterestPayload = {
        from_org_name: userOrgName || userEmail,
        target_type: type === "item" ? "item" : "buyer_profile",
        target_id: type === "item" ? (item?.item_id ?? "") : (buyer?.org_name ?? ""),
        target_title: title,
        target_owner_id:
          type === "item" ? (item?.retailer_id ?? "") : (buyer?.user_id ?? ""),
        message,
      };
      await expressInterest(userToken, payload);
      setSent(true);
      setShowMessageBox(false);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex">
      {/* Dark backdrop */}
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto flex flex-col"
      >
        {/* ── Panel Header ── */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-bold text-gray-900 truncate">{title}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                <Tag className="w-3 h-3" />
                {subtitle}
              </span>
              <ScoreBadge label={matchStrengthLabel} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Match Breakdown ── */}
        <SectionHeader>Match Breakdown</SectionHeader>
        <div className="px-6 py-5 space-y-4">
          {type === "item" && item && (
            <>
              <ScoreBar label="Semantic Match" score={item.similarity_score} color="emerald" />
              <ScoreBar label="Overall Score" score={item.composite_score} color="blue" />

              {/* Price indicator */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Price
                  </span>
                  {item.price === 0 ? (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Free
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-gray-800">
                      ${item.price.toFixed(2)} / unit
                    </span>
                  )}
                </div>
              </div>

              {/* Availability bar */}
              <ScoreBar
                label="Availability"
                score={Math.min(item.quantity / 100, 1)}
                color="emerald"
              />
            </>
          )}

          {type === "buyer" && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Match Strength</p>
                <ScoreBadge label={matchStrengthLabel} />
              </div>
              <Users className="w-8 h-8 text-emerald-400 opacity-60" />
            </div>
          )}
        </div>

        {/* ── Details ── */}
        <SectionHeader>Details</SectionHeader>
        <div className="px-6 py-5 space-y-4">
          {type === "item" && item && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Category</p>
                  <p className="text-sm font-semibold text-gray-800">{item.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Condition</p>
                  <p className="text-sm font-semibold text-gray-800 capitalize">
                    {item.condition.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Quantity Available</p>
                  <p className="text-sm font-semibold text-gray-800">{item.quantity.toLocaleString()} units</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Price / Unit</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {item.price === 0 ? "Free / Donated" : `$${item.price.toFixed(2)}`}
                  </p>
                </div>
              </div>
              {item.recommendation_text && (
                <blockquote className="border-l-4 border-emerald-400 pl-4 py-1 text-sm text-gray-600 italic bg-gray-50 rounded-r-lg">
                  {item.recommendation_text}
                </blockquote>
              )}
            </>
          )}

          {type === "buyer" && buyer && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> Segment
                  </p>
                  <p className="text-sm font-semibold text-gray-800 capitalize">{buyer.segment}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {buyer.location || "Not specified"}
                  </p>
                </div>
              </div>

              {buyer.wants && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                    <Heart className="w-3 h-3" /> Looking For
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{buyer.wants}</p>
                </div>
              )}

              {buyer.preferences.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Package className="w-3 h-3" /> Category Preferences
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {buyer.preferences.map((pref) => (
                      <span
                        key={pref}
                        className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 font-medium"
                      >
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Contact / Interest ── */}
        <SectionHeader>Contact</SectionHeader>
        <div className="px-6 py-5 flex-1">
          {userToken === null ? (
            /* Guest — prompt sign in */
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 text-center">
              <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">
                Sign in to view contact information and express interest.
              </p>
              <button
                onClick={onSignInRequired}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all"
              >
                Sign In
              </button>
            </div>
          ) : sent ? (
            /* Success state */
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-emerald-800 mb-1">Interest sent!</p>
              <p className="text-xs text-emerald-600">They'll see it in their inbox.</p>
            </div>
          ) : (
            /* Authenticated — show contact + interest button */
            <div className="space-y-4">
              {/* Contact info */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Contact Email</p>
                  {type === "item" && item?.retailer_email ? (
                    <a
                      href={`mailto:${item.retailer_email}`}
                      className="text-sm font-medium text-emerald-700 hover:underline"
                    >
                      {item.retailer_email}
                    </a>
                  ) : type === "buyer" && buyer?.contact_email ? (
                    <a
                      href={`mailto:${buyer.contact_email}`}
                      className="text-sm font-medium text-emerald-700 hover:underline"
                    >
                      {buyer.contact_email}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      Contact info not available for this demo account
                    </p>
                  )}
                </div>
              </div>

              {/* Express interest */}
              {!showMessageBox ? (
                <button
                  onClick={() => setShowMessageBox(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all"
                >
                  <Heart className="w-4 h-4" />
                  Express Interest
                </button>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a message (optional)…"
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all resize-none"
                  />
                  {sendError && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                      {sendError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowMessageBox(false); setSendError(""); }}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExpressInterest}
                      disabled={sending}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Send Interest
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom spacer so content clears on small viewports */}
        <div className="h-8" />
      </motion.div>
    </div>
  );
}

// Lock icon used in the contact section when guest
function Lock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
