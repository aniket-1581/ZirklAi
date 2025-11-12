import { OCRResponse } from '@/types';
import { buildBusinessCardFormData } from '@/utils/formDataHelper';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/v1` || 'https://netmate.mettasocial.com/api/v1';

export async function uploadBusinessCard(fileUri: string, token: string): Promise<OCRResponse> {
  const endpoint = `${BASE_URL}/extract?use_ai=true`;

  const formData = await buildBusinessCardFormData(fileUri);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      // Do not set Content-Type so fetch can set boundary automatically
    },
    body: formData,
  });

  if (res.status === 401) {
    throw new Error('Unauthorized. Please sign in again.');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Upload failed with status ${res.status}`);
  }

  const json = (await res.json()) as OCRResponse;
  return json;
}
