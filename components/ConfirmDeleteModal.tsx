'use client';

import { X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface ConfirmDeleteModalProps {
 isOpen: boolean;
 onClose: () => void;
 onConfirm: () => Promise<void>;
 title: string;
 description: string;
 confirmText?: string;
 isDestructive?: boolean;
 requireConfirmationText?: string;
}

export default function ConfirmDeleteModal({
 isOpen,
 onClose,
 onConfirm,
 title,
 description,
 confirmText = 'Delete',
 isDestructive = true,
 requireConfirmationText,
}: ConfirmDeleteModalProps) {
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [confirmationInput, setConfirmationInput] = useState('');

 if (!isOpen) return null;

 const isConfirmDisabled = isSubmitting || (
 requireConfirmationText ? confirmationInput.toLowerCase() !== requireConfirmationText.toLowerCase() : false
 );

 const handleConfirm = async () => {
 try {
 setIsSubmitting(true);
 await onConfirm();
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleClose = () => {
 setConfirmationInput('');
 onClose();
 };

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
 <div 
 className="bg-white dark:bg-[#151722] rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-[#262a3d]"
 onClick={e => e.stopPropagation()}
 >
 <div className={`px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-[#262a3d] ${isDestructive ? 'bg-red-50 dark:bg-red-900/10' : 'bg-gray-50 dark:bg-[#1b1e2c]'}`}>
 <div className={`flex items-center space-x-3 ${isDestructive ? 'text-red-600 dark:text-red-500' : 'text-gray-900 dark:text-white'}`}>
 {isDestructive && <AlertTriangle size={20} />}
 <h2 className="text-lg font-bold">{title}</h2>
 </div>
 <button 
 onClick={handleClose}
 className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
 >
 <X size={20} />
 </button>
 </div>

 <div className="p-6 space-y-4">
 <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
 {description}
 </p>
 {requireConfirmationText && (
 <div>
 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
 Type <span className="font-bold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded select-all">{requireConfirmationText}</span> to confirm
 </label>
 <input
 type="text"
 value={confirmationInput}
 onChange={(e) => setConfirmationInput(e.target.value)}
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1d27] text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
 placeholder={requireConfirmationText}
 />
 </div>
 )}
 </div>

 <div className="border-t border-gray-100 dark:border-[#262a3d] px-6 py-4 bg-gray-50 dark:bg-[#1b1e2c] flex justify-end gap-3">
 <button
 onClick={handleClose}
 disabled={isSubmitting}
 className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
 >
 Cancel
 </button>
 <button
 onClick={handleConfirm}
 disabled={isConfirmDisabled}
 className={`px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 ${
 isDestructive 
 ? 'bg-red-600 hover:bg-red-700 shadow-sm' 
 : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
 }`}
 >
 {isSubmitting ? 'Processing...' : confirmText}
 </button>
 </div>
 </div>
 </div>
 );
}
