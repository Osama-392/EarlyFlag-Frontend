'use client';

import { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface EditStudentProfileModalProps {
 isOpen: boolean;
 onClose: () => void;
 student?: {
 firstName: string;
 lastName: string;
 grade: number;
 studentId?: string;
 gender?: string;
 dateOfBirth?: string;
 };
 onSave?: (data: any) => void;
}

export default function EditStudentProfileModal({
 isOpen,
 onClose,
 student = {
 firstName: 'James',
 lastName: 'Lee',
 grade: 11,
 studentId: '',
 gender: '',
 dateOfBirth: '',
 },
 onSave,
}: EditStudentProfileModalProps) {
 const [formData, setFormData] = useState({
 firstName: student.firstName,
 lastName: student.lastName,
 grade: student.grade,
 studentId: student.studentId || '',
 gender: student.gender || '',
 dateOfBirth: student.dateOfBirth || '',
 profileImage: null as File | null,
 });

 const [imagePreview, setImagePreview] = useState<string | null>(null);

 const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 const file = e.target.files[0];
 setFormData({ ...formData, profileImage: file });
 
 // Create preview
 const reader = new FileReader();
 reader.onloadend = () => {
 setImagePreview(reader.result as string);
 };
 reader.readAsDataURL(file);
 }
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (onSave) {
 onSave(formData);
 }
 onClose();
 };

 if (!isOpen) return null;

 const grades = Array.from({ length: 7 }, (_, i) => 6 + i);

 return (
 <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm" >
 <div className="bg-white dark:bg-[#151722] rounded-xl shadow-xl max-w-[550px] w-full mx-4 max-h-[90vh] overflow-y-auto">
 {/* Header */}
 <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-[#262a3d] sticky top-0 bg-white dark:bg-[#151722]">
 <div>
 <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Student Profile</h2>
 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add or update student information</p>
 </div>
 <button
 onClick={onClose}
 className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
 >
 <X className="w-4 h-4 text-gray-500" />
 </button>
 </div>

 {/* Form */}
 <form onSubmit={handleSubmit} className="p-6 space-y-8">
 {/* Student Identity Section */}
 <div>
 <div className="flex items-center space-x-2 mb-4">
 <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">Student Identity</h3>
 <span className="px-2 py-0.5 bg-red-100 text-red-500 text-[10px] font-bold rounded-md">
 Required
 </span>
 </div>

 <div className="grid grid-cols-2 gap-4 mb-4">
 {/* First Name */}
 <div>
 <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
 First Name <span className="text-red-500">*</span>
 </label>
 <input
 type="text"
 required
 value={formData.firstName}
 onChange={(e) =>
 setFormData({ ...formData, firstName: e.target.value })
 }
 className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#262a3d] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1b1e2c] dark:text-white shadow-sm"
 placeholder="First name"
 />
 </div>

 {/* Last Name */}
 <div>
 <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
 Last Name <span className="text-red-500">*</span>
 </label>
 <input
 type="text"
 required
 value={formData.lastName}
 onChange={(e) =>
 setFormData({ ...formData, lastName: e.target.value })
 }
 className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#262a3d] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1b1e2c] dark:text-white shadow-sm"
 placeholder="Last name"
 />
 </div>
 </div>

 {/* Grade */}
 <div>
 <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
 Grade <span className="text-red-500">*</span>
 </label>
 <select
 required
 value={formData.grade}
 onChange={(e) =>
 setFormData({ ...formData, grade: parseInt(e.target.value) })
 }
 className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#262a3d] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-[#1b1e2c] dark:text-white shadow-sm appearance-none"
 >
 <option value="">Select a grade</option>
 {grades.map((grade) => (
 <option key={grade} value={grade}>
 Grade {grade}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Additional Information Section */}
 <div>
 <div className="flex items-center space-x-2 mb-4">
 <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">Additional Information</h3>
 <span className="px-2 py-0.5 bg-yellow-100/50 text-yellow-600 text-[10px] font-bold rounded-md">
 Optional
 </span>
 </div>

 {/* Student ID & Avatar */}
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
 Student ID
 </label>
 <input
 type="text"
 value={formData.studentId}
 onChange={(e) =>
 setFormData({ ...formData, studentId: e.target.value })
 }
 className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#262a3d] rounded-lg bg-gray-50 dark:bg-[#1b1e2c] text-gray-400 shadow-sm outline-none cursor-not-allowed"
 placeholder="Auto"
 disabled
 />
 </div>

 {/* Profile Avatar Upload */}
 <div>
 <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
 Profile Avatar
 </label>
 <div className="relative flex">
 <input
 type="file"
 accept="image/*"
 onChange={handleImageChange}
 className="hidden"
 id="avatar-upload"
 />
 <div className="flex-1 flex items-center px-3 py-2 border border-gray-200 dark:border-[#262a3d] rounded-l-lg bg-white dark:bg-[#1b1e2c] shadow-sm border-r-0">
 <span className="text-sm text-gray-400">Upload a file</span>
 </div>
 <label
 htmlFor="avatar-upload"
 className="flex items-center justify-center bg-red-400 hover:bg-red-500 transition-colors rounded-r-lg px-3 cursor-pointer shadow-sm"
 >
 <Upload className="w-4 h-4 text-white" />
 </label>
 </div>
 {imagePreview && (
 <div className="mt-2">
 <img
 src={imagePreview}
 alt="Preview"
 className="w-12 h-12 rounded-lg object-cover shadow-sm"
 />
 </div>
 )}
 </div>
 </div>

 {/* Gender & Date of Birth */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
 Gender
 </label>
 <select
 value={formData.gender}
 onChange={(e) =>
 setFormData({ ...formData, gender: e.target.value })
 }
 className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#262a3d] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1b1e2c] shadow-sm appearance-none text-gray-500 dark:text-gray-400"
 >
 <option value="">Select gender</option>
 <option value="male">Male</option>
 <option value="female">Female</option>
 <option value="other">Other</option>
 <option value="prefer-not-to-say">Prefer not to say</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
 Date of Birth
 </label>
 <input
 type="date"
 value={formData.dateOfBirth}
 onChange={(e) =>
 setFormData({ ...formData, dateOfBirth: e.target.value })
 }
 className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#262a3d] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1b1e2c] shadow-sm"
 placeholder="MM/DD/YYYY"
 />
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-[#262a3d]">
 <button
 type="button"
 onClick={onClose}
 className="px-6 py-2 bg-red-400 hover:bg-red-500 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-semibold shadow-sm"
 >
 Save Changes
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
