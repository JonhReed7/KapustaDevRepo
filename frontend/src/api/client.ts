const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
const TOKEN_KEY = "kapusta_token";

let token: string | null = localStorage.getItem(TOKEN_KEY);
let onUnauthorized: (() => void) | null = null;

export function setToken(newToken: string) {
  token = newToken;
  localStorage.setItem(TOKEN_KEY, newToken);
}

export function getToken(): string | null {
  return token;
}

export function clearToken() {
  token = null;
  localStorage.removeItem(TOKEN_KEY);
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
  id: number;
  email: string;
  name?: string;
}

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<User> {
  return request("POST", "/auth/register", {
    body: { email, password, name },
    auth: false,
  }) as Promise<User>;
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

export interface PollOption {
  id: number;
  label: string;
}

export interface PollQuestion {
  id: number;
  prompt: string;
  type: "single" | "multiple" | "rating" | "open_text";
  options: PollOption[];
  scale?: number;
}

export interface Poll {
  id: number;
  title: string;
  description?: string;
  status: PollStatus;
  created_at: string;
  updated_at?: string;
  responses?: number;
  public_slug?: string;
  questions?: PollQuestion[];
}

export async function getMyPolls(): Promise<Poll[]> {
  return request("GET", "/polls") as Promise<Poll[]>;
}

export async function getPoll(id: number): Promise<Poll> {
  return request("GET", `/polls/${id}`) as Promise<Poll>;
}

export async function createPollFromTemplate(
  templateKey: string,
): Promise<Poll> {
  return request("POST", `/polls/from-template/${templateKey}`) as Promise<Poll>;
}

export interface QuestionPayload {
  prompt: string;
  type: string;
  options: { label: string }[];
  scale?: number;
  sort_order: number;
}

export async function createPoll(
  title: string,
  description?: string,
  questions: QuestionPayload[] = [],
): Promise<Poll> {
  return request("POST", "/polls", {
    body: { title, description, questions },
  }) as Promise<Poll>;
}

export async function updatePoll(
  id: number,
  data: Partial<Pick<Poll, "title" | "description">> & { questions?: QuestionPayload[] },
): Promise<Poll> {
  return request("PATCH", `/polls/${id}`, { body: data }) as Promise<Poll>;
}

export async function publishPoll(id: number): Promise<Poll> {
  return request("POST", `/polls/${id}/publish`) as Promise<Poll>;
}

export async function closePoll(id: number): Promise<Poll> {
  return request("POST", `/polls/${id}/close`) as Promise<Poll>;
}

export interface EngagementData {
  engagement_index: number;
  total_started: number;
  total_completed: number;
  completion_rate: number;
  avg_completion_seconds: number | null;
  avg_time_per_question_seconds: number | null;
}

export async function getPollEngagement(id: number): Promise<EngagementData> {
  return request("GET", `/polls/${id}/engagement`) as Promise<EngagementData>;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
}

export async function exportPollResults(
  id: number,
  format = "csv",
): Promise<ExportResult> {
  const res = await request("GET", `/polls/${id}/export?format=${format}`, {
    json: false,
  }) as Response;

  const disposition = res.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^";\n]+)"?/);
  const ext = format === "xlsx" ? "xlsx" : "csv";
  const filename = match?.[1] || `poll-results.${ext}`;

  const blob = await res.blob();
  return { blob, filename };
}

// --- Public (no auth) ---

export interface PublicPollOption {
  id: number;
  label: string;
}

export interface PublicPollQuestion {
  id: number;
  prompt: string;
  type: "single" | "multiple" | "rating" | "open_text";
  scale?: number;
  options: PublicPollOption[];
}

export interface PublicPoll {
  title: string;
  description?: string;
  status: "active" | "closed";
  questions: PublicPollQuestion[];
}

export async function getPublicPoll(publicSlug: string): Promise<PublicPoll> {
  return request("GET", `/take/${publicSlug}`, { auth: false }) as Promise<PublicPoll>;
}

export async function startPublicResponse(
  publicSlug: string,
): Promise<{ poll_response_id: number }> {
  return request("POST", `/take/${publicSlug}/start`, { auth: false }) as Promise<{
    poll_response_id: number;
  }>;
}

export interface AnswerPayload {
  question_id: number;
  option_id?: number;
  rating_value?: number;
  text_value?: string;
}

export async function submitPublicResponse(
  publicSlug: string,
  pollResponseId: number,
  answers: AnswerPayload[],
): Promise<unknown> {
  return request("POST", `/take/${publicSlug}/responses`, {
    body: { poll_response_id: pollResponseId, answers },
    auth: false,
  });
}

// --- Results ---

export interface ResultOption {
  label: string;
  votes: number;
}

export interface ResultQuestionData {
  id: number;
  prompt: string;
  type: string;
  options?: ResultOption[];
  average?: number;
  scale?: number;
  texts?: string[];
}

export interface PollResults {
  title: string;
  total_responses: number;
  questions: ResultQuestionData[];
}

export async function getPollResults(id: number): Promise<PollResults> {
  return request("GET", `/polls/${id}/results`) as Promise<PollResults>;
}
