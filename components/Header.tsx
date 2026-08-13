'use client';

import { Search, Bell, ChevronDown, Plus, Play, Moon, Sun, X, User, BookOpen, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QuickLogModal from '@/components/QuickLogModal';
import { logger } from '@/lib/logger';
import { getIncompleteQuickLogs, getTeacherSearch } from '@/lib/studentService';
import { getTeacherClasses } from '@/lib/classService';
import { useTheme } from 'next-themes';
import { useAuth } from '@/app/providers';

export default function Header() {
 const { theme, setTheme, resolvedTheme } = useTheme();
 const router = useRouter();
 const [period, setPeriod] = useState('Period 3');
 const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
 const [hasIncompleteLogs, setHasIncompleteLogs] = useState(false);
 const [quickLogClassId, setQuickLogClassId] = useState<string | undefined>(undefined);
 const [mounted, setMounted] = useState(false);
 const { user } = useAuth();
 
 // Search state
 const [searchQuery, setSearchQuery] = useState('');
 const [isSearchOpen, setIsSearchOpen] = useState(false);
 const [searchClasses, setSearchClasses] = useState<any[]>([]);
 const [searchStudents, setSearchStudents] = useState<any[]>([]);
 const [searchLoading, setSearchLoading] = useState(false);
 const searchRef = useRef<HTMLDivElement>(null);
 const latestSearchRef = useRef<number>(0);
 
 const [quickLogTargetDate, setQuickLogTargetDate] = useState<string | undefined>(undefined);
 
 const userInitials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : 'U';
 const userName = user?.first_name || 'Teacher';

 useEffect(() => {
 setMounted(true);
 }, []);

 // Click outside to close search dropdown
 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
 setIsSearchOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 useEffect(() => {
 const delayDebounceFn = setTimeout(() => {
 if (searchQuery.trim().length >= 1) {
 performSearch(searchQuery);
 } else {
 setSearchClasses([]);
 setSearchStudents([]);
 }
 }, 300);

 return () => clearTimeout(delayDebounceFn);
 }, [searchQuery]);

 const performSearch = async (query: string) => {
 const currentId = ++latestSearchRef.current;
 try {
 setSearchLoading(true);
 const res = await getTeacherSearch(query);
 if (currentId === latestSearchRef.current) {
 setSearchClasses(res.classes || []);
 setSearchStudents(res.students || []);
 }
 } catch (err) {
 if (currentId === latestSearchRef.current) {
 console.error('Failed to load search data:', err);
 }
 } finally {
 if (currentId === latestSearchRef.current) {
 setSearchLoading(false);
 }
 }
 };

 useEffect(() => {
 const fetchIncompleteLogs = async () => {
 try {
 const logs = await getIncompleteQuickLogs();
 setHasIncompleteLogs(logs && logs.length > 0);
 } catch (err) {
 console.error('Failed to fetch incomplete logs for header', err);
 }
 };
 fetchIncompleteLogs();
 }, []);

 // Listen for 'open-quicklog-for-class' event from Dashboard EOD reminder
 useEffect(() => {
 const handleOpenForClass = (e: Event) => {
 const payload = (e as CustomEvent).detail;
 if (typeof payload === 'string') {
 setQuickLogClassId(payload || undefined);
 setQuickLogTargetDate(undefined);
 } else if (payload && typeof payload === 'object') {
 setQuickLogClassId(payload.classId || undefined);
 setQuickLogTargetDate(payload.date || undefined);
 }
 setIsQuickLogOpen(true);
 };
 window.addEventListener('open-quicklog-for-class', handleOpenForClass);
 return () => window.removeEventListener('open-quicklog-for-class', handleOpenForClass);
 }, []);

 const filteredClasses = searchClasses.slice(0, 5);
 const filteredStudents = searchStudents.slice(0, 8);

 return (
 <>
 <header className="bg-[#151722] border-b border-[#262a3d] px-8 h-[73px] flex items-center sticky top-0 z-50 transition-colors">
 <div className="flex items-center justify-between w-full">
 {/* Left: Search Bar */}
 <div className="flex-1 max-w-md" ref={searchRef}>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
 <input
 type="text"
 placeholder="Search classes or students..."
 value={searchQuery}
 onFocus={() => setIsSearchOpen(true)}
 onChange={(e) => {
 setSearchQuery(e.target.value);
 setIsSearchOpen(true);
 }}
 className="w-full pl-10 pr-8 py-2 text-sm border-none rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-[#1b1e2c] text-white transition-colors placeholder-gray-500"
 />
 {searchQuery && (
 <button
 onClick={() => setSearchQuery('')}
 className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 )}

 {/* Dropdown Menu */}
 {isSearchOpen && searchQuery.trim().length >= 1 && (
 <div className="absolute left-0 right-0 top-11 bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-2xl z-50 max-h-96 overflow-y-auto p-2">
 {searchLoading ? (
 <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">Loading search results...</div>
 ) : filteredClasses.length === 0 && filteredStudents.length === 0 ? (
 <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No classes or students found matching &quot;{searchQuery}&quot;</div>
 ) : (
 <div className="space-y-4">
 {/* Classes Section */}
 {filteredClasses.length > 0 && (
 <div>
 <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Classes</div>
 <div className="mt-1 space-y-1">
 {filteredClasses.map((cls) => (
 <button
 key={cls.id}
 onClick={() => {
 router.push(`/classes/${cls.slug}`);
 setIsSearchOpen(false);
 setSearchQuery('');
 }}
 className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1b1e2c] transition-colors text-left group"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
 <BookOpen className="w-4 h-4" />
 </div>
 <div>
 <div className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">
 {cls.grade_level ? `Grade ${cls.grade_level} · ` : ''}{cls.name}
 </div>
 <div className="text-xs text-gray-500 dark:text-gray-400">{cls.subject || 'General'}</div>
 </div>
 </div>
 <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Students Section */}
 {filteredStudents.length > 0 && (
 <div>
 <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Students</div>
 <div className="mt-1 space-y-1">
 {filteredStudents.map((s) => (
 <button
 key={`${s.class_id}-${s.id}`}
 onClick={() => {
 router.push(`/classes/${s.class_id}/${s.slug}`);
 setIsSearchOpen(false);
 setSearchQuery('');
 }}
 className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1b1e2c] transition-colors text-left group"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
 {s.first_name?.[0]}{s.last_name?.[0]}
 </div>
 <div>
 <div className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
 {s.first_name} {s.last_name}
 </div>
 <div className="text-xs text-gray-500 dark:text-gray-400">
 {s.class_name} {s.grade_level ? `· Grade ${s.grade_level}` : ''}
 </div>
 </div>
 </div>
 <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
 </button>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 )}
 </div>
 </div>

 {/* Right: Controls */}
 <div className="flex items-center space-x-6 ml-8">

 {/* Theme Toggle */}
 <button
 onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
 className="p-2 text-gray-300 hover:text-white transition-colors"
 aria-label="Toggle Night Mode"
 >
 {mounted && resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
 </button>


 {/* Quick Log Button */}
 <button
 onClick={() => {
 logger.buttonClick('Open Quick Log', 'Header');
 setIsQuickLogOpen(true);
 }}
 className="flex items-center space-x-2 px-4 py-1.5 bg-[#f97316] text-white rounded-md hover:bg-orange-600 font-semibold text-sm transition-colors"
 >
 <span>{hasIncompleteLogs ? 'Resume Log' : 'Quick Log'}</span>
 {hasIncompleteLogs ? <Play className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
 </button>
 </div>
 </div>
 </header>

 {/* Quick Log Modal */}
 {isQuickLogOpen && (
 <QuickLogModal
 onClose={() => {
 setIsQuickLogOpen(false);
 setQuickLogClassId(undefined);
 setQuickLogTargetDate(undefined);
 }}
 initialClassId={quickLogClassId}
 targetDate={quickLogTargetDate}
 />
 )}
 </>
 );
}
