const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/v1` || 'https://netmate.mettasocial.com/api/v1';

export async function getDraftMessageSuggestions(note_id: string, token: string, goal: string) {
    const res = await fetch(`${BASE_URL}/chat/get_message_draft_suggestion_llm/${note_id}?goals=${goal}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        },
    });
    if (!res.ok) throw new Error('Failed to fetch draft message suggestions');
    return res.json();
}

export async function getNoteChatHistory(noteId: string, token: string) {
    const res = await fetch(`${BASE_URL}/chat/${noteId}`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return res.json();
}

export async function getWelcomeMessage() {
    const res = await fetch(`${BASE_URL}/chat/welcome-message`, {
        headers: {
            'Accept': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to fetch welcome message');
    return res.json();
}

export async function getReturningMessage() {
    const res = await fetch(`${BASE_URL}/chat/returning-message`, {
        headers: {
            'Accept': 'application/json'
        },
    });
    if (!res.ok) throw new Error('Failed to fetch returning message');
    return res.json();
  }

export async function postNoteChatHistory(noteId: string, messages: any[], token: string) {
    const res = await fetch(`${BASE_URL}/chat/${noteId}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(messages),
    });
    if (!res.ok) throw new Error('Failed to post chat history');
    return res.json();
}

export async function chatWithLlm(message: string, note_content: string, note_id: string, token: string) {
    const res = await fetch(`${BASE_URL}/chat/llm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, note_content, note_id }),
    });
    if (!res.ok) throw new Error('Failed to chat with Ollama');
    return res.json();
}

export async function getLoadingMessage() {
    const res = await fetch(`${BASE_URL}/chat/loading-messages`);
    if (!res.ok) throw new Error('Failed to fetch loading message');
    return res.json();
} 