const BASE_URL = import.meta.env.DEV
  ? '/api'
  : import.meta.env.VITE_API_BASE_URL as string;

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL as string;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD as string;

const HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

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
}

export interface MatchResponse {
  recommendations: RecommendationCard[];
  buyer_segment: string;
  total_found: number;
  generated_at: string;
  served_from_cache: boolean;
}

export async function fetchMatches(queryText: string): Promise<MatchResponse> {
  const token = await getToken();
  await ensureBuyerProfile(token, queryText);

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

async function ensureBuyerProfile(token: string, queryText: string): Promise<void> {
  const check = await fetch(`${BASE_URL}/buyer/profile`, {
    headers: { ...HEADERS, Authorization: `Bearer ${token}` },
  });

  if (!check.ok) {
    await fetch(`${BASE_URL}/buyer/onboarding`, {
      method: "POST",
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        segment: "nonprofit",
        preferences: queryText.split(" ").filter((w) => w.length > 3).slice(0, 5),
        budget_min: 0,
        budget_max: 10000,
        location: "",
        notes: queryText,
      }),
    });
  } else {
    await fetch(`${BASE_URL}/buyer/profile`, {
      method: "PUT",
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: queryText }),
    });
  }
}
