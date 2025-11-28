const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://netmate.mettasocial.com';

export async function getUser(token: string) {
    const res = await fetch(`${BASE_URL}/me`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
}

export async function login(phone_number: string) {
    const details = {
        phone_number: phone_number,
    };
    const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
    if (!res.ok) throw new Error('Failed to signin');
    return res.json();
}

export async function googleAuth(){
    const res = await fetch(`${BASE_URL}/google`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to google auth');
    return res.json();
}

export async function googleAuthCallback(code: string, state: string, token: string){
    const res = await fetch(`${BASE_URL}/google/callback?code=${code}&state=${state}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!res.ok) throw new Error('Failed to google auth callback');
    return res.json();
}

export async function verifyOtp(phone_number: string, otp: string) {
    const res = await fetch(`${BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number, otp }),
    });
    if (!res.ok) throw new Error('Failed to verify OTP');
    return res.json();
}

export async function updateTimezone(token: string, timezone: string) {
    const res = await fetch(`${BASE_URL}/me/timezone`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ timezone }),
    });
    if (!res.ok) throw new Error('Failed to update timezone');
    return res.json();
}