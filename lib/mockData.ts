
import { WatchListStudent, UrgentAlert, Activity, Recognition, DayBreakdown } from '@/types';

export const watchListStudents: WatchListStudent[] = [
  {
    id: '1',
    name: 'Emma Rodriguez',
    grade: 10,
    period: 3,
    academic: 2,
    behavioral: 0,
    totalFlags: 2,
    streak: 3,
    lastFlag: '3 days ago'
  },
  {
    id: '2',
    name: 'Tyler Chen',
    grade: 10,
    period: 3,
    academic: 0,
    behavioral: 1,
    totalFlags: 1,
    streak: 0,
    lastFlag: 'Today'
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    grade: 11,
    period: 5,
    academic: 1,
    behavioral: 0,
    totalFlags: 1,
    streak: 0,
    lastFlag: 'Today'
  }
];

export const urgentAlerts: UrgentAlert[] = [
  {
    id: '1',
    student: {
      id: '4',
      name: 'Sarah Williams',
      grade: 10,
      period: 2,
      age: 16
    },
    concern: 'Missing assignments, Incomplete homework',
    timeSinceContact: '15 min ago',
    flagCount: 5
  },
  {
    id: '2',
    student: {
      id: '5',
      name: 'James Lee',
      grade: 9,
      period: 4,
      age: 15
    },
    concern: 'Excessive tardies',
    timeSinceContact: '1 hour ago',
    flagCount: 3
  },
  {
    id: '3',
    student: {
      id: '6',
      name: 'Maya Patel',
      grade: 11,
      period: 1,
      age: 16
    },
    concern: 'Disruptive behavior, Confrontational attitude',
    timeSinceContact: '45 min ago',
    flagCount: 7
  }
];

export const recentActivities: Activity[] = [
  {
    id: '1',
    type: 'flag',
    description: 'flagged for off-task behavior',
    studentName: 'Emma Rodriguez',
    timestamp: '15 min ago',
    icon: 'flag'
  },
  {
    id: '2',
    type: 'recommendation',
    description: 'received a Smart Recommendation',
    studentName: 'Marcus Johnson',
    timestamp: '33 min ago',
    icon: 'lightbulb'
  },
  {
    id: '3',
    type: 'flag',
    description: 'flagged',
    studentName: 'Alan Garcia',
    timestamp: '1 hour ago',
    icon: 'flag'
  },
  {
    id: '4',
    type: 'update',
    description: 'Vbucks system available',
    timestamp: '3 hours ago',
    icon: 'info'
  }
];

export const recognitions: Recognition[] = [
  {
    id: '1',
    teacherName: 'Alan Ma',
    title: 'Math 101 - Period 3',
    period: 3
  },
  {
    id: '2',
    teacherName: 'John McCoy',
    title: 'Science - Period 2',
    period: 2
  },
  {
    id: '3',
    teacherName: 'David Thompson',
    title: 'English - Period 1',
    period: 1
  }
];

export const weeklyBreakdown: DayBreakdown[] = [
  { day: 'Mon', count: 0, color: 'yellow' },
  { day: 'Tue', count: 12, color: 'orange' },
  { day: 'Wed', count: 15, color: 'orange' },
  { day: 'Thu', count: 18, color: 'orange' },
  { day: 'Fri', count: 22, color: 'orange' },
  { day: 'Sat', count: 16, color: 'orange' },
  { day: 'Sun', count: 24, color: 'orange' }
];

export const statsData = {
  studentsFlagged: {
    current: 5,
    trend: -15,
    label: 'Students Flagged This Week',
    description: 'vs previous week'
  },
  yellowFlags: {
    current: 34,
    trend: -8,
    label: 'Yellow Flags (30 Days)',
    description: 'vs previous period'
  },
  redFlags: {
    current: 8,
    trend: 25,
    label: 'Red Flags (30 Days)',
    description: 'vs previous period'
  }
};

