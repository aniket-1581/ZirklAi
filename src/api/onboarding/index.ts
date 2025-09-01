const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// TypeScript interfaces based on backend models
export interface OnboardingResponse {
    response: string;
}

export interface OnboardingStepResponse {
    step: string;
    message: string;
    next_step?: string;
    options?: any[];
    example?: string;
}

export interface OnboardingProgressResponse {
    current_step: string;
    completed: boolean;
    data: Record<string, any>;
}

export interface OnboardingStatusResponse {
    completed: boolean;
    current_step: string;
    total_steps: number;
}

export interface MessageVariationsResponse {
    step: string;
    variations: any[];
    count: number;
}

export interface ConversationHistoryResponse {
    conversations: any[];
    count: number;
}

// API functions
export async function getOnboardingStep(token: string): Promise<OnboardingStepResponse> {
    const url = new URL(`${BASE_URL}/api/v1/onboarding/step`);
    
    const res = await fetch(url.toString(), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to fetch onboarding step');
    return res.json() as Promise<OnboardingStepResponse>;
}

export async function saveOnboardingResponse(token: string, data: OnboardingResponse): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/onboarding/response`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save onboarding response');
    return res.json();
}

export async function getOnboardingProgress(token: string): Promise<OnboardingProgressResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/onboarding/progress`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to fetch onboarding progress');
    return res.json() as Promise<OnboardingProgressResponse>;
}

export async function resetOnboarding(token: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/onboarding/reset`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to reset onboarding');
    return res.json();
}

export async function getOnboardingStatus(token: string): Promise<OnboardingStatusResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/onboarding/status`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to fetch onboarding status');
    return res.json() as Promise<OnboardingStatusResponse>;
}

export async function getMessageVariations(token: string, step: string): Promise<MessageVariationsResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/onboarding/message-variations/${step}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to fetch message variations');
    return res.json() as Promise<MessageVariationsResponse>;
}

export async function getConversationHistory(token: string): Promise<ConversationHistoryResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/onboarding/conversation`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to fetch conversation history');
    return res.json() as Promise<ConversationHistoryResponse>;
}

export async function clearConversationHistory(token: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/onboarding/conversation`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to clear conversation history');
    return res.json();
}