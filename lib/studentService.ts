import api from './api';

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  student_id?: string;
  date_of_birth?: string;
  gender?: string;
  parent_email?: string;
  parent_phone?: string;
  address?: string;
  today_signal?: Signal;
  iep_status?: string;
  ell_status?: string;
}

export interface Signal {
  id: string;
  student_id: string;
  signal_type: 'green' | 'yellow' | 'red';
  category?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface SignalPayload {
  student_id: string;
  signal_type: 'green' | 'yellow' | 'red';
  category?: string;
  note?: string;
  reason_code?: string;
  save_for_later?: boolean;
}

export interface BatchSignalPayload {
  signals: SignalPayload[];
}

export interface ClassRosterResponse {
  class_id: string;
  class_name: string;
  students: Student[];
}

// Get students in a specific class with today's signals
export const getClassStudents = async (classId: string): Promise<Student[]> => {
  try {
    console.log('Fetching students for class:', classId);
    const response = await api.get<ClassRosterResponse>(`/api/v1/teacher/classes/${classId}/students`);
    const data = response.data?.students || [];
    return data;
  } catch (error: any) {
    console.error('Failed to fetch class students:', error?.response?.data);
    throw error;
  }
};

// Get a specific student's signal history
export const getStudentHistory = async (studentId: string) => {
  try {
    const response = await api.get(`/api/v1/teacher/students/${studentId}/history`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch student history:', error?.response?.data);
    throw error;
  }
};

// Batch log signals
export const logSignals = async (batch: BatchSignalPayload): Promise<any> => {
  try {
    const response = await api.post('/api/v1/teacher/signals', batch);
    return response.data;
  } catch (error: any) {
    console.error('Failed to log signals:', error?.response?.data);
    throw error;
  }
};

// Update a single signal
export const updateSignal = async (signalId: string, payload: Partial<SignalPayload>): Promise<Signal> => {
  try {
    const response = await api.put(`/api/v1/teacher/signals/${signalId}`, payload);
    return response.data;
  } catch (error: any) {
    console.error('Failed to update signal:', error?.response?.data);
    throw error;
  }
};

// Create a single student
export const createStudent = async (studentData: any): Promise<Student> => {
  try {
    const response = await api.post('/api/v1/teacher/students', studentData);
    return response.data;
  } catch (error: any) {
    console.error('Failed to create student:', error?.response?.data);
    throw error;
  }
};

// Bulk upload students
export const bulkUploadStudents = async (file: File): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/v1/teacher/students/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Failed to upload students:', error?.response?.data);
    throw error;
  }
};

// Create enrollment
export const createEnrollment = async (studentId: string, classId: string): Promise<any> => {
  try {
    const response = await api.post('/api/v1/teacher/enrollments', {
      student_id: studentId,
      class_id: classId,
    });
    return response.data;
  } catch (error: any) {
    console.error('Failed to create enrollment:', error?.response?.data);
    throw error;
  }
};


