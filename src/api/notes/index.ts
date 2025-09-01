const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/v1`;

export async function getNoteById(noteId: string, token: string) {
    const res = await fetch(`${BASE_URL}/notes/${noteId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    });
    if (!res.ok) throw new Error('Failed to get note by id');
    return res.json();
}

export async function getNotes(token: string) {
    const res = await fetch(`${BASE_URL}/notes`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to fetch goal notes');
    return res.json();
}

export async function createNote(token: string, notes: any[]) {
    const res = await fetch(`${BASE_URL}/notes`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(notes),
    });
    if (!res.ok) throw new Error('Failed to create note');
    return res.json();
}