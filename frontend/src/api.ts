const BASE = import.meta.env.VITE_API_URL ?? "";

export type Side = "buy" | "sell";
export type Segment = "retail" | "wholesale";
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "ready"
  | "completed"
  | "cancelled";

export interface PublicRate {
  code: string;
  name: string;
  flag: string;
  mid: number;
  buy: number;
  sell: number;
  buy_spread_pct: number;
  sell_spread_pct: number;
  effective_date: string;
}

export interface RatesResponse {
  base_currency: string;
  updated_at: string | null;
  rates: PublicRate[];
}

export interface CalcResponse {
  code: string;
  side: Side;
  amount: number;
  rate: number;
  pln_amount: number;
  segment: Segment;
}

export interface Reservation {
  id: number;
  code: string;
  currency_code: string;
  side: Side;
  amount: number;
  rate: number;
  pln_amount: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_location: string;
  note: string;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
}

export interface PriceTier {
  id: number;
  segment: Segment;
  min_amount: number;
  buy_spread_pct: number;
  sell_spread_pct: number;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
  flag: string;
  enabled: boolean;
  sort_order: number;
  buy_spread_pct: number;
  sell_spread_pct: number;
  tiers: PriceTier[];
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("kantor_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const resp = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers ?? {}),
    },
  });
  if (!resp.ok) {
    let detail = resp.statusText;
    try {
      const body = await resp.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore
    }
    throw new ApiError(resp.status, detail);
  }
  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

export const api = {
  // ---------- Public ----------
  getRates: () => request<RatesResponse>("/api/public/rates"),
  calculate: (code: string, amount: number, side: Side) =>
    request<CalcResponse>("/api/public/calculator", {
      method: "POST",
      body: JSON.stringify({ code, amount, side }),
    }),
  createReservation: (payload: {
    code: string;
    side: Side;
    amount: number;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    pickup_location?: string;
    note?: string;
  }) =>
    request<Reservation>("/api/public/reservations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getReservation: (code: string) =>
    request<Reservation>(`/api/public/reservations/${code}`),

  // ---------- Auth ----------
  login: async (username: string, password: string) => {
    const body = new URLSearchParams({ username, password });
    const resp = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!resp.ok) throw new ApiError(resp.status, "Nieprawidlowy login lub haslo");
    return (await resp.json()) as { access_token: string; role: string; username: string };
  },

  // ---------- Admin ----------
  listCurrencies: () => request<Currency[]>("/api/admin/currencies"),
  createCurrency: (payload: Partial<Currency>) =>
    request<Currency>("/api/admin/currencies", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCurrency: (id: number, payload: Partial<Currency>) =>
    request<Currency>(`/api/admin/currencies/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteCurrency: (id: number) =>
    request<void>(`/api/admin/currencies/${id}`, { method: "DELETE" }),
  addTier: (currencyId: number, payload: Omit<PriceTier, "id">) =>
    request<PriceTier>(`/api/admin/currencies/${currencyId}/tiers`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteTier: (tierId: number) =>
    request<void>(`/api/admin/tiers/${tierId}`, { method: "DELETE" }),
  refreshRates: () =>
    request<{ updated: number }>("/api/admin/rates/refresh", { method: "POST" }),
  listReservations: () => request<Reservation[]>("/api/admin/reservations"),
  updateReservationStatus: (id: number, status: ReservationStatus) =>
    request<Reservation>(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

export { ApiError };
