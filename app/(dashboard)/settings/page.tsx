'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { getSettings, updateSettings } from '@/lib/profileService';
import { Moon, Sun, Monitor, Bell, Mail, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [urgentAlerts, setUrgentAlerts] = useState(true);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // To avoid hydration mismatch for theme
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadSettings = async () => {
      try {
        const data = await getSettings();
        if (data) {
          if (data.email_notifications !== undefined) setEmailNotifications(data.email_notifications);
          if (data.urgent_alerts !== undefined) setUrgentAlerts(data.urgent_alerts);
          if (data.theme) setTheme(data.theme);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [setTheme]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await updateSettings({
        theme,
        email_notifications: emailNotifications,
        urgent_alerts: urgentAlerts
      });
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error?.response?.data?.detail || 'Failed to save settings.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto w-full flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-sora tracking-tight">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your app preferences and notifications.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20' 
            : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Appearance Settings */}
        <div className="bg-white dark:bg-[#151722] rounded-2xl shadow-sm border border-gray-200 dark:border-[#262a3d] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#262a3d]">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Monitor className="w-5 h-5 text-gray-400" />
              Appearance
            </h2>
          </div>
          <div className="p-6">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-4">Theme Preference</label>
            <div className="flex bg-gray-100 dark:bg-[#1b1e2c] p-1 rounded-xl w-fit">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  theme === 'light' 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Sun className="w-4 h-4" /> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  theme === 'dark' 
                    ? 'bg-[#262a3d] text-orange-500 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Moon className="w-4 h-4" /> Dark
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  theme === 'system' 
                    ? 'bg-white dark:bg-[#262a3d] text-orange-600 dark:text-orange-500 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Monitor className="w-4 h-4" /> System
              </button>
            </div>
          </div>
        </div>



        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
