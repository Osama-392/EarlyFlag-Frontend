'use client';

import { useState, useMemo } from 'react';
import { X, Copy, CheckCircle, Mail, AlertTriangle, AlertCircle, Sparkles, Calendar } from 'lucide-react';
import { EMAIL_TEMPLATES, fillTemplate } from '@/lib/emailTemplates';

type FlagCategory = 'red' | 'yellow' | 'super_green' | 'absent' | 'admin_concern' | 'admin_commendation';

interface ParentEmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  teacherName: string;
  flagCategory: FlagCategory;
  reason?: string;
  recentFlags?: any[];
}

const DEFAULT_REASONS: Record<FlagCategory, string> = {
  red: 'disruptive and defiant behavior in class',
  yellow: 'missing assignment and talking out of turn during class',
  super_green: 'exceptional academic growth and outstanding participation in class',
  absent: 'for 3 consecutive class sessions this week',
  admin_concern: 'a recent decline in academic performance and missing assignments',
  admin_commendation: 'exceptional progress and leadership within their classes',
};

const CATEGORY_THEME: Record<FlagCategory, {
  gradient: string;
  border: string;
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  copyBtnBg: string;
  copyBtnHover: string;
  accent: string;
}> = {
  red: {
    gradient: 'from-red-500 to-rose-600',
    border: 'border-red-200 dark:border-red-900/50',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    icon: <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />,
    label: 'Urgent Concern',
    copyBtnBg: 'bg-red-600',
    copyBtnHover: 'hover:bg-red-700',
    accent: 'text-red-600 dark:text-red-400',
  },
  yellow: {
    gradient: 'from-amber-400 to-yellow-500',
    border: 'border-amber-200 dark:border-amber-900/50',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    label: 'Moderate Concern',
    copyBtnBg: 'bg-amber-500',
    copyBtnHover: 'hover:bg-amber-600',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  super_green: {
    gradient: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-200 dark:border-emerald-900/50',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
    label: 'Positive Recognition',
    copyBtnBg: 'bg-emerald-600',
    copyBtnHover: 'hover:bg-emerald-700',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  absent: {
    gradient: 'from-blue-500 to-indigo-600',
    border: 'border-blue-200 dark:border-blue-900/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    label: 'Absence Notice',
    copyBtnBg: 'bg-blue-600',
    copyBtnHover: 'hover:bg-blue-700',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  admin_concern: {
    gradient: 'from-orange-500 to-red-600',
    border: 'border-orange-200 dark:border-orange-900/50',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    icon: <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
    label: 'Administration — Concern Notice',
    copyBtnBg: 'bg-orange-600',
    copyBtnHover: 'hover:bg-orange-700',
    accent: 'text-orange-600 dark:text-orange-400',
  },
  admin_commendation: {
    gradient: 'from-blue-500 to-indigo-600',
    border: 'border-blue-200 dark:border-blue-900/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    label: 'Administration — Commendation',
    copyBtnBg: 'bg-blue-600',
    copyBtnHover: 'hover:bg-blue-700',
    accent: 'text-blue-600 dark:text-blue-400',
  },
};

export default function ParentEmailTemplateModal({
  isOpen,
  onClose,
  studentName,
  teacherName,
  flagCategory,
  reason,
  recentFlags,
}: ParentEmailTemplateModalProps) {
  const [copied, setCopied] = useState(false);

  const dynamicConcerns = useMemo(() => {
    if (flagCategory !== 'admin_concern') return '';
    if (recentFlags && recentFlags.length > 0) {
      const topFlags = recentFlags.slice(0, 5);
      return topFlags.map((flag: any) => {
        const dateStr = new Date(flag.signal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `— ${flag.title || flag.description}${flag.class_name ? ` (${flag.class_name}, ${dateStr})` : ` (${dateStr})`}`;
      }).join('\n');
    }
    return '[No specific incidents documented in the system. Please add manually.]';
  }, [recentFlags, flagCategory]);

  const theme = CATEGORY_THEME[flagCategory];
  const template = EMAIL_TEMPLATES[flagCategory];

  const activeReason = reason || DEFAULT_REASONS[flagCategory];
  const filledBody = useMemo(
    () => fillTemplate(template.body, studentName, teacherName, activeReason, dynamicConcerns),
    [template.body, studentName, teacherName, activeReason, dynamicConcerns]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(filledBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = filledBody;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-[#151722] rounded-2xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden border border-gray-200 dark:border-[#262a3d] animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: '90vh' }}
      >
        {/* ── Coloured header banner ── */}
        <div className={`relative bg-gradient-to-r ${theme.gradient} px-6 py-5 text-white`}>
          <div className="absolute right-4 top-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Email Parent</h2>
              <p className="text-sm opacity-90">{theme.label} — {studentName}</p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {/* Category badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 ${theme.iconBg} ${theme.accent} border ${theme.border}`}>
            {theme.icon}
            {template.label}
          </div>

          {/* Instruction */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Copy the email below and paste it into your email client (Gmail, Outlook, etc.) to send to the parent or guardian.
          </p>

          {/* Template text area */}
          <div className="relative">
            <div
              className="bg-gray-50 dark:bg-[#1b1e2c] border border-gray-200 dark:border-[#2a2e42] rounded-xl p-5 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed font-[system-ui] select-all"
              style={{ minHeight: 200 }}
            >
              {filledBody}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#262a3d] flex items-center justify-between bg-gray-50/50 dark:bg-[#1b1e2c]/50">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Placeholders have been filled automatically.
          </p>

          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-bold shadow-sm transition-all ${
              copied
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : `${theme.copyBtnBg} ${theme.copyBtnHover}`
            }`}
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
