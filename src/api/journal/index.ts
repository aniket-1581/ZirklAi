const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/v1` || "http://192.168.1.5:8000/api/v1";
const WS_BASE_URL = `${process.env.EXPO_PUBLIC_WS_URL}/api/v1` || "ws://192.168.1.5:8000/api/v1";

export interface JournalEntryRequest {
  timestamp: string;
  date: string;
  time: string;
  tags: string[];
  entry: string;
}

export interface UpdateEntryRequest {
  entry_id: string;
  entry: string;
}

export interface JournalEntriesResponse {
  user_id: string;
  entries: JournalEntryRequest[];
  created_at: string;
  updated_at: string;
}

export interface JournalEntryResponse {
  id?: string;
  entry_id?: string;
  timestamp: string;
  date: string;
  time: string;
  tags: string[];
  entry: string;
  title?: string;
  user_id?: string;
}

export interface NetworkingPlaybookRespnse {
  id?: string;
  playbooks: any[];
  updated_at?: string;
  version?: number;
  type?: string;
}

export interface PlaybookResponse {
  badgeText: string;
  benefits: any[];
  cardGradient: any;
  description: string;
  framework: any[];
  header: any;
  iconName: string;
  key: string;
  nudges: string[];
  page: string;
  subtitle: string;
  title: string;
}

// Add a new journal entry
export async function addEntry(
  entry: any,
  token: string
): Promise<JournalEntriesResponse> {
  const response = await fetch(`${BASE_URL}/process_audio_journal_entry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    throw new Error("Failed to add journal entry");
  }

  return response.json();
}

// Update a journal entry title
export async function updateEntryTitle(entryId: string, title: string, token: string): Promise<any>  {
  const response = await fetch(`${BASE_URL}/update_entry_title/${entryId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Update title error:', errorData);
    throw new Error(errorData.message || 'Failed to update entry title');
  }

  return response.json();
}

// Update a journal entry
export async function updateEntry(entryId: string, entry: string, token: string): Promise<any>  {
  const response = await fetch(`${BASE_URL}/update_audio_entry/${entryId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({ entry }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Update entry error:', errorData);
    throw new Error(errorData.message || 'Failed to update entry');
  }

  return response.json();
}

// Get all journal entries
export async function getEntries(
  token: string
): Promise<JournalEntriesResponse> {
  const response = await fetch(`${BASE_URL}/get_audio_journal_entries`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch journal entries");
  }

  return response.json();
}

// Get a specific journal entry
export async function getEntry(
  entryId: string,
  token: string
): Promise<JournalEntryResponse> {
  const response = await fetch(
    `${BASE_URL}/get_audio_journal_entry/${entryId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch journal entry");
  }

  return response.json();
}

// Websocket connection for realtime audio streaming
export async function createWebSocketConnection(token: string): Promise<WebSocket> {
    const wsUrl = new URL(`${WS_BASE_URL}/audio-journal/ws`);
    wsUrl.searchParams.set("token", token);
    return new WebSocket(wsUrl.toString());
}

// Delete a journal entry
export async function deleteJournalEntry(entryId: string, token: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/delete_audio_journal_entry/${entryId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete journal entry');
  }

  return response.json();
}

// Get networking playbook
export async function getNetworkingPlaybook(): Promise<NetworkingPlaybookRespnse> {
  const response = await fetch(`${BASE_URL}/get_networking_playbook`, {
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch networking playbook");
  }

  return response.json();
}
