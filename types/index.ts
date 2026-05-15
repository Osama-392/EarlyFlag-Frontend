
export interface Student {
  id: string;
  name: string;
  grade: number;
  period: number;
  avatar?: string;
  age?: number;
}

export interface Flag {
  id: string;
  studentId: string;
  type: 'yellow' | 'red';
  category: 'academic' | 'behavioral' | 'attendance';
  description: string;
  timestamp: Date;
}

export interface WatchListStudent extends Student {
  academic: number;
  behavioral: number;
  totalFlags: number;
  streak: number;
  lastFlag: string;
}

export interface UrgentAlert {
  id: string;
  student: Student;
  concern: string;
  timeSinceContact: string;
  flagCount: number;
}

export interface Activity {
  id: string;
  type: 'flag' | 'recommendation' | 'update';
  description: string;
  studentName?: string;
  timestamp: string;
  icon: string;
}

export interface Recognition {
  id: string;
  teacherName: string;
  title: string;
  period: number;
  avatar?: string;
}

export interface DayBreakdown {
  day: string;
  count: number;
  color: 'yellow' | 'orange';
}
