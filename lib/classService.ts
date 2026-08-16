import api from './api';

export interface Class {
  id: string;
  school_id: string;
  teacher_id: string;
  name: string;
  slug: string;
  subject: string;
  grade_level: string;
  period?: string;
  room_number?: string;
  academic_year?: string;
  semester?: string;
  start_date?: string;
  end_date?: string;
  max_students?: number;
  studentCount?: number;
  teaching_days?: string[];
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
  teaching_days?: string[];
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
      teaching_days: classData.teaching_days || [],
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

export const updateClass = async (classId: string, classData: Partial<CreateClassRequest>): Promise<Class> => {
  try {
    const sanitized = {
      ...(classData.name && { name: classData.name }),
      ...(classData.subject && { subject: classData.subject }),
      ...(classData.grade_level && { grade_level: Number(classData.grade_level) }),
      ...(classData.academic_year && { academic_year: classData.academic_year }),
      ...(classData.period !== undefined && { period: classData.period ?? null }),
      ...(classData.room_number !== undefined && { room_number: classData.room_number ?? null }),
      ...(classData.teaching_days !== undefined && { teaching_days: classData.teaching_days }),
    };

    console.log('Updating class with data:', JSON.stringify(sanitized, null, 2));
    const response = await api.put(`/api/v1/teacher/classes/${classId}`, sanitized);
    console.log('Class updated successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to update class ${classId}:`);
    console.error('Status:', error?.response?.status);
    console.error('Data:', JSON.stringify(error?.response?.data, null, 2));
    throw error;
  }
};

// Get a specific class by ID
export const getClass = async (classId: string): Promise<Class> => {
  try {
    // The backend doesn't have a specific endpoint for getting a single class by ID.
    // Instead, fetch all classes for the teacher and find the matching one.
    const classes = await getTeacherClasses();
    const foundClass = classes.find(c => c.id === classId || c.slug === classId);
    if (!foundClass) {
      throw new Error(`Class with ID ${classId} not found`);
    }
    return foundClass;
  } catch (error) {
    console.error(`Failed to fetch class ${classId}:`, error);
    throw error;
  }
};

// --- Deletion & Unenrollment ---

export const deleteClassTeacher = async (classId: string): Promise<void> => {
  await api.delete(`/api/v1/teacher/classes/${classId}`);
};

export const unenrollStudentTeacher = async (classId: string, studentId: string): Promise<void> => {
  await api.delete(`/api/v1/teacher/classes/${classId}/students/${studentId}`);
};
