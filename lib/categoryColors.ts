export function getCategoryStyle(category?: string) {
  const normalized = (category || 'general').toLowerCase().trim();
  
  if (normalized.includes('behavioral')) {
    return {
      bg: 'bg-red-50 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      border: 'border border-red-100 dark:border-red-900/50',
      iconColor: 'bg-red-500' // used for small dots/lines
    };
  }
  
  if (normalized.includes('academic')) {
    return {
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border border-amber-100 dark:border-amber-900/50',
      iconColor: 'bg-amber-500'
    };
  }
  
  // Default to General (Green)
  return {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border border-emerald-100 dark:border-emerald-900/50',
    iconColor: 'bg-emerald-500'
  };
}
