const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/v1`;

export async function getGlobalChatHistory(token: string) {
    const res = await fetch(`${BASE_URL}/global-chat/history`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return res.json();
}

export async function getWelcomeMessage() {
    const res = await fetch(`${BASE_URL}/global-chat/welcome-message`, {
        headers: {
            'Accept': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to fetch welcome message');
    return res.json();
}

export async function getReturningMessage() {
    const res = await fetch(`${BASE_URL}/global-chat/returning-message`, {
        headers: {
            'Accept': 'application/json'
        },
    });
    if (!res.ok) throw new Error('Failed to fetch returning message');
    return res.json();
}

export async function getLoadingMessage() {
    const res = await fetch(`${BASE_URL}/global-chat/loading-messages`, {
        headers: {
            'Accept': 'application/json'
        },
    });
    if (!res.ok) throw new Error('Failed to fetch loading message');
    return res.json();
} 

export async function globalChatWithLlm(message: string, token: string) {
    const res = await fetch(`${BASE_URL}/global-chat/llm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Failed to chat with Ollama');
    return res.json();
}
