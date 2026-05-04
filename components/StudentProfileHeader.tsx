'use client';

interface StudentProfileHeaderProps {
  student: {
    name: string;
    grade: number;
    teacher: string;
    subject: string;
    status: string;
    daysTied: number;
    positiveDate: string;
  };
}

const statusColors = {
  'at-risk': { bg: 'bg-red-100', text: 'text-red-700', label: 'Status: At Risk' },
  'not-at-risk': { bg: 'bg-green-100', text: 'text-green-700', label: 'Status: Not At Risk' },
  monitor: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Status: Monitor' },
};

export default function StudentProfileHeader({ student }: StudentProfileHeaderProps) {
  const statusStyle = statusColors[student.status as keyof typeof statusColors];
  const initials = student.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="flex items-start space-x-6">
        {/* Profile Image */}
        <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
          {initials}
        </div>

        {/* Student Info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
          <p className="text-gray-500 mt-1">
            {student.grade}th Grade | {student.teacher} | {student.subject}
          </p>

          {/* Status & Info Badges */}
          <div className="flex items-center space-x-2 mt-4 flex-wrap gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}
            >
              {statusStyle.label}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              Days Tied: {student.daysTied}
            </span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
              Positive: {student.positiveDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
