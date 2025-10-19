const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/v1` || 'https://netmate.mettasocial.com/api/v1';

export async function getProfileStatus(token: string) {
  const res = await fetch(`${BASE_URL}/onboarding/status`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch profile status");
  return res.json();
}

export async function setPhoneContacts(token: string, data: any) {
  const res = await fetch(`${BASE_URL}/profile/sync-contacts`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to set user details");
  return res.json();
}

export async function getPhoneContacts(token: string) {
  const res = await fetch(`${BASE_URL}/profile/contacts`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to set user details");
  return res.json();
}

export async function createNote(token: string, notes: any[]) {
  console.log("Creating note:", notes);
  const res = await fetch(`${BASE_URL}/notes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(notes),
  });
  if (!res.ok) throw new Error("Failed to create note");
  return res.json();
}

export async function updateProfile(token: string, data: any) {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}


export async function getNudges(token: string) {
  const res = await fetch(`${BASE_URL}/profile/nudge-data`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
  });
  if (!res.ok) throw new Error("Failed to fetch nudges");
  return res.json();
}

export async function deleteNudge(token: string, nudgeId: string) {
  const res = await fetch(`${BASE_URL}/profile/nudge-data/${nudgeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ nudgeId }),
  });
  if (!res.ok) throw new Error("Failed to delete nudge");
  return res.json();
}