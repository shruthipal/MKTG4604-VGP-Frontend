const BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || '');

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL as string;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD as string;

const HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

// ── Buyer auth ─────────────────────────────────────────────────────────────────

let cachedToken: string | null = null;

export async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  });

  if (!res.ok) throw new Error("Auth failed");
  const data = await res.json();
  cachedToken = data.access_token;
  return cachedToken as string;
}

// ── Retailer auth ──────────────────────────────────────────────────────────────

const retailerTokenCache: Record<string, string> = {};

export async function getRetailerToken(email: string, password: string): Promise<string> {
  if (retailerTokenCache[email]) return retailerTokenCache[email];

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Retailer auth failed");
  const data = await res.json();
  retailerTokenCache[email] = data.access_token;
  return retailerTokenCache[email];
}

export function clearRetailerToken(email: string) {
  delete retailerTokenCache[email];
}

// ── Buyer match types & functions ──────────────────────────────────────────────

export interface RecommendationCard {
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

export interface MatchResponse {
  recommendations: RecommendationCard[];
  buyer_segment: string;
  total_found: number;
  generated_at: string;
  served_from_cache: boolean;
}

export interface FetchMatchesParams {
  queryText: string;
  location?: string;
  quantity?: string;
  budget?: string;
  isPurchasing?: boolean;
  minPrice?: string;
  maxPrice?: string;
  organizationName?: string;
}

export async function fetchMatches(params: FetchMatchesParams): Promise<MatchResponse> {
  const token = await getToken();
  await ensureBuyerProfile(token, params);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(`${BASE_URL}/match/recommendations`, {
      method: "POST",
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Match request failed");
    }

    return res.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out — the pipeline took over 60 s. Try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function ensureBuyerProfile(token: string, params: FetchMatchesParams): Promise<void> {
  const { queryText, location, budget, isPurchasing, minPrice, maxPrice } = params;

  const budgetMax = maxPrice ? parseFloat(maxPrice) :
                   budget ? parseFloat(budget.replace(/[^0-9.]/g, "")) :
                   10000;
  const budgetMin = minPrice ? parseFloat(minPrice) : 0;

  const check = await fetch(`${BASE_URL}/buyer/profile`, {
    headers: { ...HEADERS, Authorization: `Bearer ${token}` },
  });

  const profileBody = {
    segment: isPurchasing ? "reseller" : "nonprofit",
    preferences: queryText.split(" ").filter((w) => w.length > 3).slice(0, 5),
    budget_min: budgetMin,
    budget_max: budgetMax,
    location: location || "",
    notes: queryText,
  };

  if (!check.ok) {
    await fetch(`${BASE_URL}/buyer/onboarding`, {
      method: "POST",
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
      body: JSON.stringify(profileBody),
    });
  } else {
    await fetch(`${BASE_URL}/buyer/profile`, {
      method: "PUT",
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
      body: JSON.stringify(profileBody),
    });
  }
}

// ── Business registration ─────────────────────────────────────────────────────

export async function registerBusiness(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ email, password, role: "retailer" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Sign up failed");
  }
  const data = await res.json();
  return data.access_token as string;
}

// ── Buyer registration ────────────────────────────────────────────────────────

export interface BuyerRegistrationPayload {
  email: string;
  password: string;
  segment: "nonprofit" | "reseller" | "smb";
  preferences: string[];
  budget_min: number;
  budget_max: number;
  location?: string;
  notes?: string;
}

export async function registerBuyer(payload: BuyerRegistrationPayload): Promise<void> {
  // Step 1: sign up
  const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ email: payload.email, password: payload.password, role: "buyer" }),
  });
  if (!signupRes.ok) {
    const err = await signupRes.json().catch(() => ({}));
    throw new Error(err.detail || "Sign up failed");
  }
  const { access_token } = await signupRes.json();

  // Step 2: create buyer profile
  const profileRes = await fetch(`${BASE_URL}/buyer/onboarding`, {
    method: "POST",
    headers: { ...HEADERS, Authorization: `Bearer ${access_token}` },
    body: JSON.stringify({
      segment: payload.segment,
      preferences: payload.preferences,
      budget_min: payload.budget_min,
      budget_max: payload.budget_max,
      location: payload.location || "",
      notes: payload.notes || "",
    }),
  });
  if (!profileRes.ok) {
    const err = await profileRes.json().catch(() => ({}));
    throw new Error(err.detail || "Profile creation failed");
  }
}

// ── Business-side buyer search ────────────────────────────────────────────────

export interface BuyerInterestCard {
  org_name: string;
  segment: string;
  location: string | null;
  wants: string;
  preferences: string[];
  match_strength: "Strong" | "Good" | "Moderate";
  contact_email?: string;
  user_id?: string;
}

export interface BuyerSearchResponse {
  buyers: BuyerInterestCard[];
  total_found: number;
  query: string;
}

export async function searchInterestedBuyers(queryText: string): Promise<BuyerSearchResponse> {
  const token = await getToken();

  const res = await fetch(`${BASE_URL}/match/buyers/search`, {
    method: "POST",
    headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: queryText }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Buyer search failed");
  }
  return res.json();
}

// ── Retailer inventory types & functions ───────────────────────────────────────

export interface InventoryItem {
  id: string;
  retailer_id: string;
  title: string;
  category: string;
  quantity: number;
  price: number;
  condition: string;
  expiry_date: string;
  description: string | null;
  location: string | null;
  status: string;
  embedded: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryUploadPayload {
  title: string;
  category: string;
  quantity: number;
  price: number;
  condition: string;
  expiry_date: string;
  description?: string;
  location?: string;
}

export async function getOwnInventory(retailerToken: string): Promise<InventoryItem[]> {
  const res = await fetch(`${BASE_URL}/inventory/`, {
    headers: { ...HEADERS, Authorization: `Bearer ${retailerToken}` },
  });
  if (!res.ok) throw new Error("Failed to load inventory");
  return res.json();
}

export async function uploadInventoryItem(
  retailerToken: string,
  payload: InventoryUploadPayload,
): Promise<InventoryItem> {
  const res = await fetch(`${BASE_URL}/inventory/upload`, {
    method: "POST",
    headers: { ...HEADERS, Authorization: `Bearer ${retailerToken}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail?.[0]?.msg || err.detail || "Upload failed");
  }
  return res.json();
}

export async function updateItemStatus(
  retailerToken: string,
  itemId: string,
  status: "sold" | "expired",
): Promise<void> {
  const res = await fetch(`${BASE_URL}/inventory/${itemId}/status`, {
    method: "PATCH",
    headers: { ...HEADERS, Authorization: `Bearer ${retailerToken}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
}

// ── Retailer alerts types & functions ──────────────────────────────────────────

export interface RetailerAlert {
  id: string;
  item_id: string;
  item_title: string;
  match_score_label: string;
  match_count: number;
  is_read: boolean;
  created_at: string;
}

export async function getRetailerAlerts(retailerToken: string): Promise<RetailerAlert[]> {
  const res = await fetch(`${BASE_URL}/match/alerts`, {
    headers: { ...HEADERS, Authorization: `Bearer ${retailerToken}` },
  });
  if (!res.ok) throw new Error("Failed to load alerts");
  return res.json();
}

export async function markAlertRead(retailerToken: string, alertId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/match/alerts/${alertId}/read`, {
    method: "PATCH",
    headers: { ...HEADERS, Authorization: `Bearer ${retailerToken}` },
  });
  if (!res.ok) throw new Error("Failed to mark alert as read");
}

// ── Interest / Inbox ──────────────────────────────────────────────────────────

export interface InterestPayload {
  from_org_name: string;
  target_type: "item" | "buyer_profile";
  target_id: string;
  target_title: string;
  target_owner_id: string;
  message: string;
}

export interface InboxItem {
  id: string;
  from_user_id: string;
  from_email: string;
  from_org_name: string;
  from_role: string;
  target_type: string;
  target_id: string;
  target_title: string;
  target_owner_id: string;
  message: string;
  is_read: number;
  created_at: string;
}

export async function expressInterest(token: string, payload: InterestPayload): Promise<void> {
  const res = await fetch(`${BASE_URL}/match/interest`, {
    method: "POST",
    headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to express interest");
  }
}

export async function getInbox(token: string): Promise<InboxItem[]> {
  const res = await fetch(`${BASE_URL}/match/inbox`, {
    headers: { ...HEADERS, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load inbox");
  return res.json();
}

export async function markInterestRead(token: string, interestId: string): Promise<void> {
  await fetch(`${BASE_URL}/match/inbox/${interestId}/read`, {
    method: "PATCH",
    headers: { ...HEADERS, Authorization: `Bearer ${token}` },
  });
}

export async function getUserToken(email: string, password: string): Promise<{ token: string; role: string }> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  const data = await res.json();
  return { token: data.access_token, role: data.role };
}
