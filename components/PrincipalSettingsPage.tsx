'use client';

import { Lock, Bell, Users, Shield, Eye, Database } from 'lucide-react';
import { useState } from 'react';

export default function PrincipalSettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    criticalAlerts: true,
    weeklyDigest: true,
    dataCollection: true,
  });

  const handleToggle = (key: string) => {
    setSettings((prev) => {
      const k = key as keyof typeof settings;
      return {
        ...prev,
        [k]: !prev[k],
      };
    });
  };

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white dark:text-white" style={{ fontFamily: 'Playfair Display' }}>
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">Manage your school and account preferences</p>
      </div>

      {/* Account Settings */}
      <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d]">
          <Shield size={24} className="text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Account Security</h3>
        </div>

        <div className="space-y-4">
          <button className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-gray-600 dark:text-gray-400 dark:text-gray-400" />
              <span className="text-gray-900 dark:text-white dark:text-white font-medium">Change Password</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
            <div className="flex items-center gap-3">
              <Users size={20} className="text-gray-600 dark:text-gray-400 dark:text-gray-400" />
              <span className="text-gray-900 dark:text-white dark:text-white font-medium">Two-Factor Authentication</span>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Not Enabled</span>
          </button>

          <button className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-gray-600 dark:text-gray-400 dark:text-gray-400" />
              <span className="text-gray-900 dark:text-white dark:text-white font-medium">Active Sessions</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d]">
          <Bell size={24} className="text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Notification Preferences</h3>
        </div>

        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
            { key: 'criticalAlerts', label: 'Critical Alerts', desc: 'Immediate alerts for critical student cases' },
            { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of school-wide metrics' },
          ].map((pref) => (
            <div key={pref.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
              <div>
                <p className="font-medium text-gray-900 dark:text-white dark:text-white">{pref.label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">{pref.desc}</p>
              </div>
              <button
                onClick={() => handleToggle(pref.key)}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                  settings[pref.key as keyof typeof settings] ? 'bg-teal-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white dark:bg-[#151722] dark:bg-[#151722] transition-transform ${
                    settings[pref.key as keyof typeof settings] ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d]">
          <Database size={24} className="text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Data & Privacy</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white dark:text-white">Data Collection</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">Allow anonymous usage analytics</p>
            </div>
            <button
              onClick={() => handleToggle('dataCollection')}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                settings.dataCollection ? 'bg-teal-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white dark:bg-[#151722] dark:bg-[#151722] transition-transform ${
                  settings.dataCollection ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <button className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
            <span className="text-gray-900 dark:text-white dark:text-white font-medium">Download My Data</span>
            <span className="text-gray-400">→</span>
          </button>

          <button className="w-full flex items-center justify-between px-4 py-3 border border-red-200 rounded-lg hover:bg-red-50 transition">
            <span className="text-red-600 font-medium">Delete Account</span>
            <span className="text-gray-400">→</span>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-4">
        <button className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
          Save Changes
        </button>
      </div>
    </div>
  );
}
