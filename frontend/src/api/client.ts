const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setToken(newToken: string) {
  token = newToken;
}

export function getToken(): string | null {
  return token;
}

export function clearToken() {
  token = null;
}

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail || "Request failed");
    this.status = status;
    this.detail = detail;
  }
}

interface RequestOptions {
  body?: unknown;
  auth?: boolean;
  json?: boolean;
}

async function request(
  method: string,
  path: string,
  { body, auth = true, json = true }: RequestOptions = {},
): Promise<unknown> {
  const headers: Record<string, string> = {};

  if (auth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (body !== undefined && json) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined && json ? JSON.stringify(body) : (body as BodyInit | undefined),
  });

  if (!res.ok) {
    let detail = "Request failed";
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {}

    if (res.status === 401 && onUnauthorized) {
      onUnauthorized();
    }

    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  return res;
}

// --- Auth ---

export interface AuthResponse {
  access_token: string;
  token_type?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export async function register(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const data = await request("POST", "/auth/register", {
    body: { email, password },
    auth: false,
  });
  return data as AuthResponse;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const data = await request("POST", "/auth/login", {
    body: { email, password },
    auth: false,
  });
  const auth = data as AuthResponse;
  token = auth.access_token;
  return auth;
}

export async function getCurrentUser(): Promise<User> {
  return request("GET", "/auth/me") as Promise<User>;
}

// --- Polls (owner-only) ---

export type PollStatus = "draft" | "active" | "closed";

export interface Poll {
  id: string;
  title: string;
  description?: string;
  status: PollStatus;
  created_at: string;
  updated_at?: string;
  response_count: number;
  public_slug?: string;
}

export async function getMyPolls(): Promise<Poll[]> {
  return request("GET", "/polls") as Promise<Poll[]>;
}

export async function getPoll(id: string): Promise<Poll> {
  return request("GET", `/polls/${id}`) as Promise<Poll>;
}

export async function createPollFromTemplate(
  templateKey: string,
): Promise<Poll> {
  return request("POST", `/polls/from-template/${templateKey}`) as Promise<Poll>;
}

export async function updatePoll(
  id: string,
  data: Partial<Pick<Poll, "title" | "description">>,
): Promise<Poll> {
  return request("PATCH", `/polls/${id}`, { body: data }) as Promise<Poll>;
}

export async function publishPoll(id: string): Promise<Poll> {
  return request("POST", `/polls/${id}/publish`) as Promise<Poll>;
}

export async function closePoll(id: string): Promise<Poll> {
  return request("POST", `/polls/${id}/close`) as Promise<Poll>;
}

export async function getPollEngagement(id: string): Promise<unknown> {
  return request("GET", `/polls/${id}/engagement`);
}

export async function exportPollResults(
  id: string,
  format = "csv",
): Promise<Blob | unknown> {
  return request("GET", `/polls/${id}/export?format=${format}`, {
    json: false,
  });
}

// --- Public (no auth) ---

export async function getPublicPoll(publicSlug: string): Promise<unknown> {
  return request("GET", `/take/${publicSlug}`, { auth: false });
}

export async function startPublicResponse(
  publicSlug: string,
): Promise<unknown> {
  return request("POST", `/take/${publicSlug}/start`, { auth: false });
}

export async function submitPublicResponse(
  publicSlug: string,
  pollResponseId: string,
  answers: unknown[],
): Promise<unknown> {
  return request("POST", `/take/${publicSlug}/responses`, {
    body: { poll_response_id: pollResponseId, answers },
    auth: false,
  });
}
