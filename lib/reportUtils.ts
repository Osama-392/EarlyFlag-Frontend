export const isGlobalAutoEscalation = (signal: any): boolean => {
  if (!signal) return false;

  const reasonCode = String(signal.reason_code || '').toLowerCase();
  const reasonDescription = String(signal.reason_description || signal.reason || '').toLowerCase();
  const note = String(signal.note || '').toLowerCase();
  const alertRule = String(signal.triggered_by_rule || signal.rule || '').toLowerCase();

  if (alertRule.includes('global') || alertRule.includes('cross-class') || alertRule.includes('cross_class')) return true;
  if (reasonDescription.includes('(global)') || reasonDescription.includes('global') || reasonDescription.includes('cross-class') || reasonDescription.includes('across all classes')) return true;
  if (note.includes('across all classes') || note.includes('cross-class') || note.includes('auto-escalated to red') || note.includes('system auto-escalation (global)')) return true;
  if (reasonCode === 'auto_escalation' && (note.includes('all classes') || note.includes('auto-escalat') || reasonDescription.includes('global'))) return true;

  return false;
};

const filterReportCollections = (report: any) => {
  if (!report || typeof report !== 'object') return report;

  return {
    ...report,
    ...(Array.isArray(report.flag_log) && {
      flag_log: report.flag_log.filter((flag: any) => !isGlobalAutoEscalation(flag)),
    }),
    ...(Array.isArray(report.recent_flags) && {
      recent_flags: report.recent_flags.filter((flag: any) => !isGlobalAutoEscalation(flag)),
    }),
  };
};

export const filterGlobalEscalationsFromReportData = <T extends Record<string, any>>(reportData: T): T => {
  const result = reportData?.result;
  if (!result || typeof result !== 'object') return { ...reportData };

  if (result.report && typeof result.report === 'object') {
    return {
      ...reportData,
      result: {
        ...result,
        report: filterReportCollections(result.report),
      },
    };
  }

  return {
    ...reportData,
    result: filterReportCollections(result),
  };
};
