import api from './api';

export interface Class {
  id: string;
  school_id: string;
  teacher_id: string;
  name: string;
  subject: string;
  grade_level: string;
  period?: string;
  room_number?: string;
  academic_year?: string;
  semester?: string;
  start_date?: string;
  end_date?: string;
  max_students?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateClassRequest {
  name: string;
  subject: string;
  grade_level: number;
  academic_year: string;
  period?: number | null;
  room_number?: string | null;
  semester?: string;
  start_date?: string;
  end_date?: string;
  max_students?: number;
}

// Get all classes for the authenticated teacher
export const getTeacherClasses = async (): Promise<Class[]> => {
  try {
    const response = await api.get('/api/v1/teacher/classes');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
};

export const createClass = async (classData: CreateClassRequest): Promise<Class> => {
  try {
    const sanitized = {
      name: classData.name,
      subject: classData.subject,
      grade_level: Number(classData.grade_level),
      academic_year: classData.academic_year,
      period: classData.period ?? null,
      room_number: classData.room_number ?? null,
    };

    console.log('Creating class with data:', JSON.stringify(sanitized, null, 2));
    const response = await api.post('/api/v1/teacher/classes', sanitized);
    console.log('Class created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to create class:');
    console.error('Status:', error?.response?.status);
    console.error('Data:', JSON.stringify(error?.response?.data, null, 2));
    throw error;
  }
};

// Get a specific class by ID
export const getClass = async (classId: string): Promise<Class> => {
  try {
    const response = await api.get(`/api/v1/teacher/classes/${classId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch class:', error);
    throw error;
  }
};
