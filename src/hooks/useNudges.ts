import { useState, useCallback } from 'react';
import { getNudges } from '@/api/profile';

export interface Nudge {
  _id: string;
  user_id: string;
  notification_id: string;
  state_name: string;
  note_id: string;
  contact_name: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export const useNudges = () => {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNudges = useCallback(async (token: string) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getNudges(token);
      setNudges(data.nudges || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nudges');
      setNudges([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      // For React Native, we'll use the Clipboard API if available
      // For now, we'll just return the text that should be copied
      return text;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      throw err;
    }
  }, []);

  return {
    nudges,
    loading,
    error,
    fetchNudges,
    copyToClipboard
  };
};
