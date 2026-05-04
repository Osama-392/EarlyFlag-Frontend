'use client';

import { ArrowLeft, Mail, MessageSquare, Edit, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import StudentProfileHeader from '@/components/StudentProfileHeader';
import Last7DayStats from '@/components/Last7DayStats';
import FlagHistory from '@/components/FlagHistory';
import TeachersNotes from '@/components/TeachersNotes';
import LeaveNoteModal from '@/components/LeaveNoteModal';
import EmailCounselorModal from '@/components/EmailCounselorModal';
import EditStudentProfileModal from '@/components/EditStudentProfileModal';

interface StudentProfile {
  id: string;
  name: string;
  grade: number;
  teacher: string;
  subject: string;
  profileImage?: string;
  status: 'at-risk' | 'not-at-risk' | 'monitor';
  daysTied: number;
  positiveDate: string;
  academicFlags: number;
  behavioralFlags: number;
  academicProgress: number;
  behavioralProgress: number;
}

interface Flag {
  id: string;
  date: string;
  type: 'academic' | 'behavioral';
  description: string;
  action?: string;
}

interface Note {
  id: string;
  date: string;
  teacher: string;
  content: string;
}

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const [isLeaveNoteOpen, setIsLeaveNoteOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [student, setStudent] = useState<StudentProfile>({
    id: params.id,
    name: 'James Lee',
    grade: 9,
    teacher: 'Ms. Johnson',
    subject: 'Spanish',
    status: 'not-at-risk',
    daysTied: 4,
    positiveDate: 'March 08',
    academicFlags: 7,
    behavioralFlags: 5,
    academicProgress: 60,
    behavioralProgress: 80,
  });

  // Mock data
  const flags: Flag[] = [
    {
      id: '1',
      date: 'March 9',
      type: 'academic',
      description: 'Correct Followup Lesson',
      action: 'Academic',
    },
    {
      id: '2',
      date: 'March 8',
      type: 'behavioral',
      description: 'Field Language',
      action: 'Behavioral',
    },
    {
      id: '3',
      date: 'March 7',
      type: 'academic',
      description: 'Correct Followup Lesson',
      action: 'Academic',
    },
    {
      id: '4',
      date: 'March 6',
      type: 'academic',
      description: 'Needs to follow directions',
      action: 'Academic',
    },
    {
      id: '5',
      date: 'March 5',
      type: 'behavioral',
      description: 'Classroom Disruption',
      action: 'Behavioral',
    },
  ];

  const notes: Note[] = [
    {
      id: '1',
      date: 'March 10, 2026',
      teacher: 'Ms. Johnson',
      content:
        'James has been consistently trying to stay on task during group activities. When directing peers, though, he needs reminders to use clear language. I notice a consistent trend in his work quality.',
    },
    {
      id: '2',
      date: 'Feb 28, 2026',
      teacher: 'Mr. Chen',
      content:
        'Great work on last test! James showed excellent understanding of the concepts. Despite some of his errors in past work, his recent submission is well-structured and organized.',
    },
    {
      id: '3',
      date: 'Feb 22, 2026',
      teacher: 'Ms. Rodriguez',
      content:
        'Outstanding behavior! James has maintained focus throughout the class. Several instances of helping peers, well done! He has been consistently engaging with the curriculum.',
    },
  ];

  const handleSaveProfile = (data: any) => {
    console.log('Profile updated:', data);
    // Update student data
    setStudent({
      ...student,
      name: `${data.firstName} ${data.lastName}`,
      grade: data.grade,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/students"
          className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Student Roster
        </Link>
      </div>

      {/* Student Profile Header */}
      <StudentProfileHeader student={student} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Last 7 Day & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Last 7 Day Stats */}
          <Last7DayStats student={student} />

          {/* Teachers Notes */}
          <TeachersNotes notes={notes} />
        </div>

        {/* Right Column - Flag History */}
        <div>
          <FlagHistory flags={flags} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center space-x-3 pt-6 border-t border-gray-200">
        <button
          onClick={() => setIsEmailOpen(true)}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Mail className="w-5 h-5" />
          <span>Email Counselor</span>
        </button>
        <button
          onClick={() => setIsLeaveNoteOpen(true)}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Leave Note</span>
        </button>
        <button
          onClick={() => setIsEditOpen(true)}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          <Edit className="w-5 h-5" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Modals */}
      <LeaveNoteModal
        isOpen={isLeaveNoteOpen}
        onClose={() => setIsLeaveNoteOpen(false)}
        studentName={student.name}
      />
      <EmailCounselorModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        studentName={student.name}
      />
      <EditStudentProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        student={{
          firstName: student.name.split(' ')[0],
          lastName: student.name.split(' ')[1],
          grade: student.grade,
        }}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
