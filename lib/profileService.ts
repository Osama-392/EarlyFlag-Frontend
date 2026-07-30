import api from './api';

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
}

export interface UserSettingsUpdate {
  theme?: string;
  email_notifications?: boolean;
  urgent_alerts?: boolean;
}

export const updateProfile = async (data: UserUpdate) => {
  try {
    const response = await api.patch('/api/v1/auth/profile', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
};

export const getSettings = async () => {
  try {
    const response = await api.get('/api/v1/auth/settings');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return {};
  }
};

export const updateSettings = async (data: UserSettingsUpdate) => {
  try {
    const response = await api.patch('/api/v1/auth/settings', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
};
