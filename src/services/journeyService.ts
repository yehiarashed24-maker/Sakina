const API_BASE = import.meta.env.VITE_API_URL || "";

export interface TrendData {
  status: string;
  status_ar: string;
  delta: number;
  average: number;
  has_sufficient_data: boolean;
  explanation?: string;
}

export interface SafetyStatusData {
  level: string;
  label: string;
  label_ar: string;
  badge_color: string;
  description: string;
}

export interface JourneyOverview {
  checkins_count: number;
  active_days: number;
  current_trend: TrendData;
  safety_status: SafetyStatusData;
}

export interface CheckinItem {
  id: string;
  mood_score: number;
  factors: string[];
  note: string;
  date: string;
  time: string;
  timestamp: string;
}

export interface TimelineSession {
  id: string;
  conversation_id: string;
  session_type: 'chat' | 'talk';
  date: string;
  time: string;
  summary: string;
  summary_ar?: string;
  summary_en?: string;
  themes: string[];
  user_reported_concerns: string[];
  suggested_actions: { title: string; type: string }[];
  safety_level: string;
}

export interface ThemeItem {
  theme: string;
  session_count: number;
  conversation_ids: string[];
}

export interface ComparisonData {
  period_days: number;
  current_avg: number;
  previous_avg: number;
  delta: number;
  current_count: number;
  previous_count: number;
  top_current_themes: string[];
  top_previous_themes: string[];
}

export interface ProgressData {
  narrative_ar: string;
  narrative_en: string;
  has_comparison: boolean;
  comparison?: ComparisonData;
  completed_actions_count: number;
}

export interface SupportAction {
  id: string;
  title: string;
  title_ar?: string;
  title_en?: string;
  action_type: string;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at?: string;
}

export interface SupportActionsResponse {
  actions: SupportAction[];
  total: number;
  completed: number;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("sakina_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
}

export async function fetchJourneyOverview(): Promise<JourneyOverview> {
  const res = await fetch(`${API_BASE}/api/journey/overview`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to load overview");
  return res.json();
}

export async function createCheckin(data: {
  mood_score: number;
  factors: string[];
  note?: string;
}): Promise<CheckinItem> {
  const res = await fetch(`${API_BASE}/api/journey/checkins`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to save check-in");
  return res.json();
}

export async function fetchCheckins(days: number = 30): Promise<CheckinItem[]> {
  const res = await fetch(`${API_BASE}/api/journey/checkins?days=${days}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to load check-ins");
  return res.json();
}

export async function fetchJourneyTimeline(): Promise<TimelineSession[]> {
  const res = await fetch(`${API_BASE}/api/journey/timeline`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to load journey timeline");
  return res.json();
}

export async function fetchRecurringThemes(): Promise<ThemeItem[]> {
  const res = await fetch(`${API_BASE}/api/journey/themes`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to load themes");
  return res.json();
}

export async function fetchProgressInsights(): Promise<ProgressData> {
  const res = await fetch(`${API_BASE}/api/journey/progress`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to load progress insights");
  return res.json();
}

export async function fetchSupportActions(): Promise<SupportActionsResponse> {
  const res = await fetch(`${API_BASE}/api/journey/actions`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to load support plan");
  return res.json();
}

export async function toggleSupportAction(actionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/journey/actions/${actionId}/complete`, {
    method: "POST",
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to toggle support action");
}

export async function fetchMemorySettings(): Promise<{ memory_enabled: boolean }> {
  const res = await fetch(`${API_BASE}/api/journey/memory-settings`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return { memory_enabled: true };
  return res.json();
}

export async function updateMemorySettings(memory_enabled: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/api/journey/memory-settings`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ memory_enabled })
  });
  if (!res.ok) throw new Error("Failed to update memory settings");
}

export async function clearJourneyMemory(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/journey/memory`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to clear memory");
}

export interface SessionMessage {
  id: string;
  isAi: boolean;
  textEn: string;
  textAr: string;
  created_at: string;
}

export async function fetchConversationMessages(convId: string): Promise<SessionMessage[]> {
  try {
    const res = await fetch(`${API_BASE}/api/conversations/${convId}/messages`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  } catch {
    return [];
  }
}
