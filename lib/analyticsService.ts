import api from './api';

// ─── Signal Stats Types ─────────────────────────────────────────────

export interface SignalStats {
  window_start: string;
  window_end: string;
  total_signals: number;
  super_green_count: number;
  present_count: number;
  yellow_count: number;
  red_count: number;
  absent_count: number;
  yellow_academic_count: number;
  yellow_behavioral_count: number;
  red_academic_count: number;
  red_behavioral_count: number;
}

// ─── API Calls ──────────────────────────────────────────────────────

export const getSignalStats = async (windowDays: number = 7): Promise<SignalStats> => {
  try {
    const response = await api.get(`/api/v1/signal/stats?window_days=${windowDays}`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch signal stats:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

// Fetch stats for multiple windows in parallel
export const getMultiWindowStats = async (): Promise<{
  week: SignalStats;
  month: SignalStats;
  quarter: SignalStats;
}> => {
  const [week, month, quarter] = await Promise.all([
    getSignalStats(7),
    getSignalStats(30),
    getSignalStats(90),
  ]);
  return { week, month, quarter };
};
