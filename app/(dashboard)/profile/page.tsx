'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { updateProfile } from '@/lib/profileService';
import { User, Mail, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await updateProfile({ first_name: firstName, last_name: lastName });
      updateUser({ first_name: firstName, last_name: lastName });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error?.response?.data?.detail || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const userInitials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-sora tracking-tight">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your personal information and account details.</p>
      </div>

      <div className="bg-white dark:bg-[#151722] rounded-2xl shadow-sm border border-gray-200 dark:border-[#262a3d] overflow-hidden">
        {/* Header Cover */}
        <div className="h-32 bg-gradient-to-r from-orange-500 to-amber-500 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white dark:bg-[#1b1e2c] rounded-full p-1.5 shadow-lg">
              <div className="w-full h-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500 rounded-full flex items-center justify-center text-3xl font-bold font-sora">
                {userInitials}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            {message && (
              <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20' 
                  : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1b1e2c] border border-gray-200 dark:border-[#262a3d] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  placeholder="Enter your first name"
                  required
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1b1e2c] border border-gray-200 dark:border-[#262a3d] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full bg-gray-100 dark:bg-[#11131a] border border-gray-200 dark:border-[#262a3d] rounded-xl px-4 py-3 text-gray-500 dark:text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email addresses cannot be changed directly. Contact support if you need to update this.</p>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-[#262a3d] flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
