const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/v1` || 'https://netmate.mettasocial.com/api/v1';

export interface ProfileStatusResponse {
  is_completed: boolean;
  current_step: number;
  next_step: number;
}

export async function getProfileStatus(token: string): Promise<ProfileStatusResponse> {
  const res = await fetch(`${BASE_URL}/profile/status`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch profile status");
  return res.json();
}

export async function getStepData(token: string, step_number: number) {
  const res = await fetch(`${BASE_URL}/profile/step/${step_number}`, {
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch step data");
  return res.json();
}

export async function setUserPersona(token: string, persona: string) {
  const res = await fetch(`${BASE_URL}/profile/step/1`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
    body: JSON.stringify({ "persona": persona }),
  });
  if (!res.ok) throw new Error("Failed to set user persona");
  return res.json();
}

export async function setUserChallenges(token: string, challenges: string) {
  const res = await fetch(`${BASE_URL}/profile/step/2`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
    body: JSON.stringify({ "user_challenges": challenges }),
  });
  if (!res.ok) throw new Error("Failed to set user challenges");
  return res.json();
}

export async function setUserStrategy(token: string, strategy: string) {
  const res = await fetch(`${BASE_URL}/profile/step/3`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
    body: JSON.stringify({ "strategy": strategy }),
  });
  if (!res.ok) throw new Error("Failed to set user strategy");
  return res.json();
}

export async function setUserEngagementPlan(token: string, engagementPlan: string) {
  const res = await fetch(`${BASE_URL}/profile/step/4`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
    body: JSON.stringify({ "engagement_plan": engagementPlan }),
  });
  if (!res.ok) throw new Error("Failed to set user engagement plan");
  return res.json();
}

export async function setUserProfile(token: string, data: any) {
  const res = await fetch(`${BASE_URL}/profile/step/5`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to set user profile");
  return res.json();
}

export async function setContactSync(token: string, data: any) {
  const res = await fetch(`${BASE_URL}/profile/step/6`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to set user profile");
  return res.json();
}

export async function setUserExpertiseLevel(token: string, expertiseLevel: string) {
  const res = await fetch(`${BASE_URL}/profile/step/7`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
    body: JSON.stringify({ "expertise_level": expertiseLevel }),
  });
  if (!res.ok) throw new Error("Failed to set user expertise level");
  return res.json();
}

export async function setStartNetworking(token: string) {
  const res = await fetch(`${BASE_URL}/profile/step/8`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH"
  });
  if (!res.ok) throw new Error("Failed to set user profile");
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