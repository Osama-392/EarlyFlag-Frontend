'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Download, AlertCircle, RefreshCw, Search, ChevronLeft, ChevronRight,
  FileText, Filter, Sparkles, Users,
} from 'lucide-react';
import {
  getAdminReferrals, exportSuperGreenJson, downloadSuperGreenCsv,
  EscalationLogBlock, SuperGreenExportPayload, ReferralFilterParams,
} from '@/lib/adminDashboardService';

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
  normal: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 text-gray-700',
};
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', sent: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700',
  bounced: 'bg-red-100 text-red-700',
};

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

export default function PrincipalReportsPage() {
  const [tab, setTab] = useState<'referrals' | 'supergreen'>('referrals');

  // Referrals state
  const [referrals, setReferrals] = useState<EscalationLogBlock | null>(null);
  const [refLoading, setRefLoading] = useState(true);
  const [refError, setRefError] = useState<string | null>(null);
  const [refPage, setRefPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const PAGE_SIZE = 20;

  // Super Green state
  const [sgData, setSgData] = useState<SuperGreenExportPayload | null>(null);
  const [sgLoading, setSgLoading] = useState(false);
  const [sgError, setSgError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchReferrals = useCallback(async () => {
    try {
      setRefLoading(true); setRefError(null);
      const params: ReferralFilterParams = { limit: PAGE_SIZE, offset: refPage * PAGE_SIZE };
      if (statusFilter.length) params.status = statusFilter;
      if (priorityFilter.length) params.priority = priorityFilter;
      const data = await getAdminReferrals(params);
      setReferrals(data);
    } catch (err: any) {
      setRefError(err?.response?.data?.detail || 'Failed to load referrals.');
    } finally { setRefLoading(false); }
  }, [refPage, statusFilter, priorityFilter]);

  useEffect(() => { if (tab === 'referrals') fetchReferrals(); }, [fetchReferrals, tab]);

  const fetchSuperGreen = async () => {
    try {
      setSgLoading(true); setSgError(null);
      const data = await exportSuperGreenJson();
      setSgData(data);
    } catch (err: any) {
      setSgError(err?.response?.data?.detail || 'Failed to load Super Green data.');
    } finally { setSgLoading(false); }
  };

  useEffect(() => { if (tab === 'supergreen' && !sgData) fetchSuperGreen(); }, [tab]);

  const handleDownloadCsv = async () => {
    try { setDownloading(true); await downloadSuperGreenCsv(); }
    catch (err) { console.error('CSV download failed:', err); }
    finally { setDownloading(false); }
  };

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
    setRefPage(0);
  };

  const totalPages = referrals ? Math.ceil(referrals.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');`}</style>

      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>Reports</h1>
        <p className="text-gray-600">Counselor escalation log and recognition exports</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'referrals' as const, label: 'Counselor Escalation Log', icon: FileText },
          { id: 'supergreen' as const, label: 'Super Green Export', icon: Sparkles },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              tab === t.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {/* ── Referrals Tab ──────────────────────────────────────── */}
      {tab === 'referrals' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700"><Filter size={14} /> Filters</div>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Email Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {['pending','sent','delivered','failed','bounced'].map(s => (
                    <button key={s} onClick={() => toggleFilter(statusFilter, s, setStatusFilter)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${statusFilter.includes(s) ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Priority</p>
                <div className="flex flex-wrap gap-1.5">
                  {['low','normal','high','urgent'].map(p => (
                    <button key={p} onClick={() => toggleFilter(priorityFilter, p, setPriorityFilter)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${priorityFilter.includes(p) ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          {refLoading ? (
            <div className="space-y-3 animate-pulse">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}</div>
          ) : refError ? (
            <div className="text-center py-12">
              <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
              <p className="text-gray-600">{refError}</p>
              <button onClick={fetchReferrals} className="mt-3 text-teal-600 text-sm font-medium">Retry</button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Referred By</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Follow-up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(referrals?.referrals || []).map(r => (
                      <tr key={r.referral_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{r.student_first_name} {r.student_last_name}</p>
                          <p className="text-xs text-gray-500">Grade {r.student_grade_level} · {r.external_student_id}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{r.referred_by_first_name} {r.referred_by_last_name}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${priorityColors[r.priority] || ''}`}>{r.priority}</span></td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[r.email_status] || ''}`}>{r.email_status}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.created_at)}</td>
                        <td className="px-4 py-3 text-xs">{r.follow_up_needed ? <span className="text-orange-600 font-medium">⚡ Yes{r.follow_up_date ? ` · ${formatDate(r.follow_up_date)}` : ''}</span> : <span className="text-gray-400">—</span>}</td>
                      </tr>
                    ))}
                    {(referrals?.referrals || []).length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">No referrals found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-500">{referrals?.total || 0} total referrals</p>
                  <div className="flex items-center gap-2">
                    <button disabled={refPage === 0} onClick={() => setRefPage(p => p - 1)}
                      className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition"><ChevronLeft size={16} /></button>
                    <span className="text-sm text-gray-700">{refPage + 1} / {totalPages}</span>
                    <button disabled={refPage >= totalPages - 1} onClick={() => setRefPage(p => p + 1)}
                      className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition"><ChevronRight size={16} /></button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Super Green Tab ────────────────────────────────────── */}
      {tab === 'supergreen' && (
        <div className="space-y-4">
          {sgLoading ? (
            <div className="space-y-3 animate-pulse"><div className="h-20 bg-gray-200 rounded-xl" /><div className="h-64 bg-gray-200 rounded-xl" /></div>
          ) : sgError ? (
            <div className="text-center py-12">
              <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
              <p className="text-gray-600">{sgError}</p>
              <button onClick={fetchSuperGreen} className="mt-3 text-teal-600 text-sm font-medium">Retry</button>
            </div>
          ) : sgData && (
            <>
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2"><Sparkles size={20} className="text-emerald-600" /> Super Green Recognition</h3>
                    <p className="text-sm text-gray-600 mt-1">{sgData.academic_year_label} · Threshold: {sgData.threshold}+ signals · {sgData.row_count} qualifying students</p>
                  </div>
                  <button onClick={handleDownloadCsv} disabled={downloading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50">
                    <Download size={16} />{downloading ? 'Downloading...' : 'Download CSV'}
                  </button>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Grade</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Count</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Top Reasons</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Last Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Badges</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sgData.students.map(s => (
                        <tr key={s.student_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">{s.first_name} {s.last_name}</p>
                            <p className="text-xs text-gray-500">{s.student_id_external}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{s.grade_level}</td>
                          <td className="px-4 py-3"><span className="text-lg font-bold text-emerald-600">{s.super_green_count}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {s.top_reasons.map((r, i) => (
                                <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">{r.replace(/_/g, ' ')}</span>
                              ))}
                              {s.top_reasons.length === 0 && <span className="text-xs text-gray-400">—</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{formatDate(s.last_super_green_date)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {s.iep_status && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold">IEP</span>}
                              {s.ell_status && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">ELL</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {sgData.students.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">No qualifying students this year</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
