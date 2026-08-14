'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, Copy, CheckCircle, Mail, Loader2 } from 'lucide-react';
import { getStudentHistory } from '@/lib/studentService';
import { getAdminStudentProfile } from '@/lib/adminDashboardService';
import { logTeacherEmail } from '@/lib/dashboardService';
import { getClass } from '@/lib/classService';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';

type FlagCategory = 'red' | 'red_academic' | 'red_behavioral' | 'yellow' | 'yellow_academic' | 'yellow_behavioral' | 'super_green' | 'absent' | 'admin_concern' | 'admin_commendation' | 'admin_attendance';

interface ParentEmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  teacherName: string;
  flagCategory: FlagCategory;
  reason?: string;
  recentFlags?: any[];
  studentId?: string;
  adminEmailReason?: string;
  adminEmailConcerns?: string | null;
  classId?: string;
}

const DEFAULT_REASONS: Record<FlagCategory, string> = {
  red: 'disruptive and defiant behavior in class',
  red_academic: 'missing multiple critical assignments and failing grades',
  red_behavioral: 'disruptive and defiant behavior in class',
  yellow: 'missing assignment and talking out of turn during class',
  yellow_academic: 'missing assignment and struggling to keep up with classwork',
  yellow_behavioral: 'talking out of turn during class',
  super_green: 'exceptional academic growth and outstanding participation in class',
  absent: 'for 3 consecutive class sessions this week',
  admin_concern: 'a recent decline in academic performance and missing assignments',
  admin_commendation: 'exceptional progress and leadership within their classes',
  admin_attendance: 'chronic absenteeism across multiple classes',
};

const CATEGORY_THEME: Record<FlagCategory, any> = {
  red: {
    gradient: 'from-red-500 to-rose-600',
    label: 'Urgent Concern',
    copyBtnBg: 'bg-red-600',
    copyBtnHover: 'hover:bg-red-700',
  },
  red_academic: {
    gradient: 'from-red-500 to-rose-600',
    label: 'Urgent Academic Concern',
    copyBtnBg: 'bg-red-600',
    copyBtnHover: 'hover:bg-red-700',
  },
  red_behavioral: {
    gradient: 'from-red-500 to-rose-600',
    label: 'Urgent Behavioral Concern',
    copyBtnBg: 'bg-red-600',
    copyBtnHover: 'hover:bg-red-700',
  },
  yellow: {
    gradient: 'from-amber-400 to-yellow-500',
    label: 'Moderate Concern',
    copyBtnBg: 'bg-amber-500',
    copyBtnHover: 'hover:bg-amber-600',
  },
  yellow_academic: {
    gradient: 'from-amber-400 to-yellow-500',
    label: 'Academic Check-in',
    copyBtnBg: 'bg-amber-500',
    copyBtnHover: 'hover:bg-amber-600',
  },
  yellow_behavioral: {
    gradient: 'from-amber-400 to-yellow-500',
    label: 'Behavioral Check-in',
    copyBtnBg: 'bg-amber-500',
    copyBtnHover: 'hover:bg-amber-600',
  },
  super_green: {
    gradient: 'from-emerald-500 to-teal-600',
    label: 'Positive Recognition',
    copyBtnBg: 'bg-emerald-600',
    copyBtnHover: 'hover:bg-emerald-700',
  },
  absent: {
    gradient: 'from-blue-500 to-indigo-600',
    label: 'Absence Notice',
    copyBtnBg: 'bg-blue-600',
    copyBtnHover: 'hover:bg-blue-700',
  },
  admin_concern: {
    gradient: 'from-orange-500 to-red-600',
    label: 'Administration — Concern Notice',
    copyBtnBg: 'bg-orange-600',
    copyBtnHover: 'hover:bg-orange-700',
  },
  admin_commendation: {
    gradient: 'from-blue-500 to-indigo-600',
    label: 'Administration — Commendation',
    copyBtnBg: 'bg-blue-600',
    copyBtnHover: 'hover:bg-blue-700',
  },
  admin_attendance: {
    gradient: 'from-orange-500 to-amber-600',
    label: 'Administration — Attendance Concern',
    copyBtnBg: 'bg-orange-600',
    copyBtnHover: 'hover:bg-orange-700',
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
  studentId,
  adminEmailReason,
  adminEmailConcerns,
  classId,
}: ParentEmailTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fetchedFlags, setFetchedFlags] = useState<any[] | null>(null);
  const [renderedText, setRenderedText] = useState<string>('');
  const [templateId, setTemplateId] = useState<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && studentId && !recentFlags) {
      const fetchHistory = async () => {
        try {
          const history = await getStudentHistory(studentId);
          setFetchedFlags(history.signals || []);
        } catch (e) {
          try {
            const profile = await getAdminStudentProfile(studentId);
            setFetchedFlags(profile.flag_log || []);
          } catch (err) {
            console.error("Failed to fetch student flags for email template", err);
          }
        }
      };
      fetchHistory();
    }
  }, [isOpen, studentId, recentFlags]);

  const flagsList = useMemo(() => recentFlags || fetchedFlags || [], [recentFlags, fetchedFlags]);

  const dynamicConcerns = useMemo(() => {
    if (flagCategory !== 'admin_concern') return '';
    if (adminEmailConcerns) {
      return `Among the specific concerns that have been documented:\n${adminEmailConcerns}`;
    }
    return '';
  }, [flagCategory, adminEmailConcerns]);

  const activeReasonData = useMemo(() => {
    let reasonText: string | null = null;
    let flaggedReasonText: string | null = null;

    if (flagCategory === 'admin_concern' && adminEmailReason) {
      reasonText = adminEmailReason;
    } else if (flagCategory.startsWith('red') || flagCategory.startsWith('yellow')) {
      if (flagsList.length > 0) {
        const targetType = flagCategory.startsWith('red') ? 'red' : 'yellow';
        const matchingFlag = flagsList.find((f: any) => f.signal_type?.toLowerCase() === targetType);

        if (matchingFlag) {
          reasonText = matchingFlag.note || matchingFlag.description || null;
          
          if (matchingFlag.reason_description) {
            flaggedReasonText = matchingFlag.reason_description;
          } else if (matchingFlag.reason_code) {
            flaggedReasonText = matchingFlag.reason_code;
          } else if (matchingFlag.reasons && matchingFlag.reasons.length > 0) {
            flaggedReasonText = matchingFlag.reasons.join(', ');
          } else if (matchingFlag.rule_description) {
            flaggedReasonText = matchingFlag.rule_description;
          } else {
            const classStr = matchingFlag.class_name ? matchingFlag.class_name : 'class';
            const categoryStr = matchingFlag.category ? matchingFlag.category.replace('_', ' ').toLowerCase() : 'general';
            flaggedReasonText = `${categoryStr} concerns in ${classStr}`;
          }
        }
      }
    }

    if (!reasonText && reason) {
      reasonText = reason;
    }
    
    if (!flaggedReasonText && !reasonText) {
       flaggedReasonText = DEFAULT_REASONS[flagCategory];
    }

    const cleanText = (str: string | null | undefined) => {
      if (!str || typeof str !== 'string') return null;
      let cleaned = str.replace(/\[auto\]\s*-?\s*/gi, '').replace(/\bflagged\b\s*/gi, '').trim();
      if (cleaned.endsWith('.')) {
        cleaned = cleaned.slice(0, -1);
      }
      if (cleaned.length > 0 && cleaned[0] === cleaned[0].toUpperCase() && !/^[A-Z]{2,}/.test(cleaned)) {
        cleaned = cleaned[0].toLowerCase() + cleaned.slice(1);
      }
      return cleaned;
    };

    return {
      reason: cleanText(reasonText),
      flaggedReason: cleanText(flaggedReasonText)
    };
  }, [reason, flagsList, flagCategory, adminEmailReason]);

  // Fetch the template on mount / open
  useEffect(() => {
    if (isOpen && studentId) {
      let isMounted = true;
      const fetchTemplate = async () => {
        setLoading(true);
        try {
          let payloadClassId = '00000000-0000-0000-0000-000000000000';
          if (classId) {
            try {
              const classData = await getClass(classId);
              payloadClassId = classData.id;
            } catch (err) {
              payloadClassId = classId;
            }
          } else if (flagsList.length > 0 && flagsList[0].class_id) {
            payloadClassId = flagsList[0].class_id;
          }
          
          const payload = {
            class_id: payloadClassId,
            template_type: flagCategory,
            reason: activeReasonData.reason,
            flagged_reason: activeReasonData.flaggedReason,
            dynamic_concerns: dynamicConcerns
          };
          
          const res = await api.post(`/api/v1/teacher/students/${studentId}/templates/select`, payload);
          if (isMounted) {
            setTemplateId(res.data.template_id);
            setRenderedText(res.data.rendered_text);
          }
        } catch (err) {
          console.error("Failed to fetch template", err);
          if (isMounted) {
            setRenderedText('Failed to generate template. Please try again.');
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      fetchTemplate();
      return () => { isMounted = false; };
    }
  }, [isOpen, studentId, flagCategory, activeReasonData, dynamicConcerns, classId, flagsList]);

  const [subjectCopied, setSubjectCopied] = useState(false);

  const { subject, body } = useMemo(() => {
    if (!renderedText) return { subject: '', body: '' };
    const lines = renderedText.split(/\r?\n/);
    const firstLine = lines[0] || '';
    
    let subjectText = `Message regarding ${studentName}`;
    let bodyText = renderedText;
    
    if (firstLine.toLowerCase().startsWith('subject:')) {
      subjectText = firstLine.substring(8).trim();
      let bodyLines = lines.slice(1);
      while (bodyLines.length > 0 && bodyLines[0].trim() === '') {
        bodyLines = bodyLines.slice(1);
      }
      bodyText = bodyLines.join('\n');
    }

    // Fix hard-wrapped lines from backend templates
    const cleanEmailBody = (text: string) => {
      const bLines = text.split(/\r?\n/);
      const resultLines: string[] = [];
      
      let currentParagraph: string[] = [];
      
      for (let i = 0; i < bLines.length; i++) {
        const line = bLines[i].trim();
        
        if (line === '') {
          if (currentParagraph.length > 0) {
            resultLines.push(currentParagraph.join(' '));
            currentParagraph = [];
          }
          resultLines.push('');
        } else {
          // If the line is short (e.g. signature "Best," or "John Doe"), and it's not the first line of a paragraph,
          // we might not want to merge it if it looks like a signature.
          // However, the simplest robust heuristic: if the PREVIOUS line in the paragraph was long, this is probably a continuation.
          // If we just join everything in the block until an empty line, it might merge the signature!
          // Let's check if the line looks like a signature sign-off.
          const lowerLine = line.toLowerCase();
          if (lowerLine === 'best,' || lowerLine === 'best regards,' || lowerLine === 'regards,' || lowerLine === 'sincerely,' || lowerLine === 'thank you,' || lowerLine.startsWith('thank you for')) {
            if (currentParagraph.length > 0) {
              resultLines.push(currentParagraph.join(' '));
              currentParagraph = [];
            }
            resultLines.push(line);
          } else {
            currentParagraph.push(line);
          }
        }
      }
      
      if (currentParagraph.length > 0) {
        resultLines.push(currentParagraph.join(' '));
      }
      
      return resultLines.join('\n');
    };

    return { 
      subject: subjectText, 
      body: cleanEmailBody(bodyText)
    };
  }, [renderedText, studentName]);

  const handleCopySubject = async () => {
    if (!subject || loading) return;
    try {
      await navigator.clipboard.writeText(subject);
      setSubjectCopied(true);
      showToast("Subject copied!", "success");
      setTimeout(() => setSubjectCopied(false), 2000);
    } catch (err) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = subject;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setSubjectCopied(true);
        showToast("Subject copied!", "success");
        setTimeout(() => setSubjectCopied(false), 2000);
      } catch (fallbackErr) {
        showToast("Failed to copy subject", "error");
      }
    }
  };

  const handleCopy = async () => {
    const copyContent = body || renderedText;
    if (!copyContent || loading) return;
    
    try {
      await navigator.clipboard.writeText(copyContent);
      setCopied(true);
      showToast(`Copied Email Body`, 'success');
      
      if (studentId) {
        logTeacherEmail(studentId, {
          flagCategory,
          templateIndex: templateId || 1,
          renderedText: renderedText,
        });
      }
      
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy template", err);
      try {
        const textarea = document.createElement('textarea');
        textarea.value = copyContent;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        showToast(`Copied Email Body`, 'success');
        setTimeout(() => setCopied(false), 2500);
      } catch (fallbackErr) {
        showToast("Failed to copy to clipboard", "error");
      }
    }
  };

  const theme = CATEGORY_THEME[flagCategory] || CATEGORY_THEME['red'];

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
          {/* Instruction */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Copy the email subject and body below to paste into your email client.
          </p>

          {/* Subject Box */}
          {subject && !loading && (
            <div className="mb-4 bg-gray-50 dark:bg-[#1b1e2c] border border-gray-200 dark:border-[#2a2e42] rounded-xl p-3.5 flex items-center justify-between shadow-sm">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 mb-0.5">Subject</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 select-all">{subject}</p>
              </div>
              <button
                onClick={handleCopySubject}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                  subjectCopied 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-white hover:bg-gray-50 text-slate-700 border border-gray-200 dark:bg-[#262a3d] dark:hover:bg-[#2e334a] dark:text-slate-300 dark:border-[#383d56]'
                }`}
              >
                {subjectCopied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {subjectCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}

          {/* Template text area */}
          <div className="relative">
            <div
              className={`bg-gray-50 dark:bg-[#1b1e2c] border border-gray-200 dark:border-[#2a2e42] rounded-xl p-5 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed font-[system-ui] select-all flex flex-col ${loading ? 'justify-center items-center' : 'text-left'}`}
              style={{ minHeight: 200 }}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center text-gray-400 py-10 w-full h-full">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-sm font-medium">Generating template...</span>
                </div>
              ) : (
                body
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#262a3d] flex items-center justify-between bg-gray-50/50 dark:bg-[#1b1e2c]/50">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {loading ? 'Fetching templates...' : 'Placeholders have been filled automatically.'}
          </p>

          <button
            onClick={handleCopy}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-bold shadow-sm transition-all ${copied
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : `${theme.copyBtnBg} ${theme.copyBtnHover}`
              } disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Body
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}