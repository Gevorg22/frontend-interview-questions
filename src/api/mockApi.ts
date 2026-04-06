import type { QuestionsData } from './types';

const API_BASE_URL = 'https://69d35e3d336103955f8ee1df.mockapi.io/questions-api';

let cachedData: QuestionsData | null = null;
let lastSync: number = 0;
const SYNC_INTERVAL = 5000;

export const mockApi = {
  async fetchData(): Promise<QuestionsData> {
    try {
      const now = Date.now();
      if (cachedData && (now - lastSync) < SYNC_INTERVAL) {
        return cachedData;
      }

      const response = await fetch(`${API_BASE_URL}?limit=1`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data: unknown = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        cachedData = this.normalizeData(data[0] as Record<string, unknown>);
      } else {
        cachedData = await this.createData();
      }
      
      lastSync = now;
      return cachedData;
    } catch (error) {
      console.error('Failed to fetch from mockapi, using cache:', error);
      return cachedData || this.getDefaultData();
    }
  },

  normalizeData(data: Record<string, unknown>): QuestionsData {
    return {
      id: String(data.id || 'temp-' + Date.now()),
      userId: String(data.userId || 'default-user'),
      progress: (data.progress as Record<string, boolean>) || {},
      spacedRepetition: Object.entries(data.spacedRepetition as Record<string, unknown> || {}).reduce((acc, [key, value]) => {
        const val = value as Record<string, number>;
        acc[key] = {
          lastMarked: val.lastMarked || Date.now(),
          interval: val.interval || 1,
          repetitions: val.repetitions || 1,
        };
        return acc;
      }, {} as Record<string, { lastMarked: number; interval: number; repetitions: number }>),
      updatedAt: String(data.updatedAt || new Date().toISOString()),
    };
  },

  async updateData(updates: Partial<QuestionsData>): Promise<QuestionsData> {
    try {
      const currentData = await this.fetchData();
      const updatedData = {
        ...currentData,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/${currentData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error(`Update failed: ${response.status}`);
      
      const result = this.normalizeData(await response.json() as Record<string, unknown>);
      cachedData = result;
      lastSync = Date.now();
      return result;
    } catch (error) {
      console.error('Failed to update mockapi:', error);
      throw error;
    }
  },

  async createData(): Promise<QuestionsData> {
    try {
      const newData = {
        userId: 'default-user',
        progress: {},
        spacedRepetition: {},
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });

      if (!response.ok) throw new Error(`Create failed: ${response.status}`);
      
      const result = this.normalizeData(await response.json() as Record<string, unknown>);
      cachedData = result;
      lastSync = Date.now();
      return result;
    } catch (error) {
      console.error('Failed to create mockapi record:', error);
      throw error;
    }
  },

  getDefaultData(): QuestionsData {
    return {
      id: 'temp-' + Date.now(),
      userId: 'default-user',
      progress: {},
      spacedRepetition: {},
      updatedAt: new Date().toISOString(),
    };
  },

  clearCache(): void {
    cachedData = null;
    lastSync = 0;
  },
};

