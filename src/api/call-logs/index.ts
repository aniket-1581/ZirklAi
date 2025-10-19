const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/v1` || 'https://netmate.mettasocial.com/api/v1';

// Types
export interface CallLogItem {
  id?: string;
  dateTime: string;
  duration: number;
  name: string;
  phoneNumber: string;
  timestamp: number;
  type: "INCOMING" | "OUTGOING" | "MISSED";
}

export interface CallLogResponse extends CallLogItem {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CallLogListResponse {
  call_logs: CallLogResponse[];
  total_count: number;
}

// Helper
async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
  return res.json();
}

// Create multiple call logs
export async function createCallLogs(callLogs: CallLogItem[]) {
  return fetchJSON<CallLogResponse[]>(`${BASE_URL}/call-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ call_logs: callLogs }),
  });
}

// Get paginated call logs
export async function getCallLogs(params?: { limit?: number; skip?: number }) {
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  const url = `${BASE_URL}/call-logs${query ? "?" + query : ""}`;
  return fetchJSON<CallLogResponse[]>(url);
}

// Get a specific call log
export async function getCallLogById(id: string) {
  return fetchJSON<CallLogResponse>(`${BASE_URL}/call-logs/${id}`);
}

// Delete a specific call log
export async function deleteCallLog(id: string) {
  const res = await fetch(`${BASE_URL}/call-logs/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await res.text());
  const result = await res.json();
  return result.success;
}

// Delete all call logs
export async function deleteAllCallLogs() {
  const res = await fetch(`${BASE_URL}/call-logs`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await res.text());
  const result = await res.json();
  return result.deleted;
}

// Get total count
export async function getCallLogsCount() {
  const res = await fetch(`${BASE_URL}/call-logs/count`);
  if (!res.ok) throw new Error(await res.text());
  const result = await res.json();
  return result.count;
}
