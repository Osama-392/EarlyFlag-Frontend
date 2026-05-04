'use client';

interface Flag {
  id: string;
  date: string;
  type: 'academic' | 'behavioral';
  description: string;
  action?: string;
}

interface FlagHistoryProps {
  flags: Flag[];
}

const typeColors = {
  academic: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Academic' },
  behavioral: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Behavioral' },
};

export default function FlagHistory({ flags }: FlagHistoryProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Flag History</h2>
      <p className="text-sm text-gray-500 mb-6">Last 7 entries</p>

      <div className="space-y-3">
        {flags.map((flag) => {
          const typeStyle = typeColors[flag.type];
          return (
            <div
              key={flag.id}
              className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Date */}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{flag.date}</p>
              </div>

              {/* Type Badge */}
              <span
                className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${typeStyle.bg} ${typeStyle.text}`}
              >
                {typeStyle.label}
              </span>

              {/* Description Badge */}
              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
                {flag.action || flag.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
