'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Bell, Settings, LogOut, Search, Moon, Sun, ChevronDown, X, User, BookOpen, Users, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { getAdminHeatmap, getAdminLeaderboard, getAdminStudentReports, getAdminTeacherReports, getAdminSearch } from '@/lib/adminDashboardService';

export default function PrincipalHeader() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchClasses, setSearchClasses] = useState<any[]>([]);
  const [searchTeachers, setSearchTeachers] = useState<any[]>([]);
  const [searchStudents, setSearchStudents] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  // Live debounced search when user types
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await getAdminSearch(searchQuery.trim());
        setSearchTeachers(res.teachers || []);
        setSearchClasses(res.classes || []);
        setSearchStudents(res.students || []);
      } catch (err) {
        console.error('Failed live search:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadSearchData = async () => {
    if (dataLoaded || searchLoading) return;
    try {
      setSearchLoading(true);
      const [heatData, leaderData, studentsReport, teachersReport] = await Promise.all([
        getAdminHeatmap('1d').catch(() => null),
        getAdminLeaderboard('1d').catch(() => []),
        getAdminStudentReports({ limit: 500 }).catch(() => null),
        getAdminTeacherReports({ limit: 500 }).catch(() => null),
      ]);
      
      const tiles = heatData?.grade_buckets?.flatMap(b => b.tiles) || [];
      setSearchClasses(tiles);
      
      // Combine teachers from reports and leaderboard, normalizing names
      const teachersMap = new Map();
      (leaderData || []).forEach((t: any) => {
        const id = t.teacher_id || t.id;
        if (id) {
          teachersMap.set(id, {
            ...t,
            id,
            first_name: t.teacher_first_name || t.first_name || '',
            last_name: t.teacher_last_name || t.last_name || '',
          });
        }
      });
      (teachersReport?.teachers || []).forEach((t: any) => {
        const id = t.teacher_id || t.id;
        if (id) {
          const existing = teachersMap.get(id) || {};
          teachersMap.set(id, {
            ...existing,
            ...t,
            id,
            first_name: t.first_name || existing.first_name || '',
            last_name: t.last_name || existing.last_name || '',
          });
        }
      });

      setSearchTeachers(Array.from(teachersMap.values()));
      setSearchStudents(studentsReport?.students || []);
      setDataLoaded(true);
    } catch (err) {
      console.error('Failed to load admin search data:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const userInitials = user ? `${user.first_name?.[0] || user.email?.charAt(0) || ''}${user.last_name?.[0] || ''}`.toUpperCase() : 'P';
  const userName = user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email?.split('@')[0];

  const qLower = searchQuery.toLowerCase().trim();
  const filteredClasses = qLower ? searchClasses.filter(c => {
    const cName = c.class_name || c.name || '';
    const subj = c.subject || '';
    const tName = c.teacher_name || `${c.teacher_first_name || ''} ${c.teacher_last_name || ''}`.trim();
    return (
      cName.toLowerCase().includes(qLower) ||
      subj.toLowerCase().includes(qLower) ||
      c.grade_level?.toString() === qLower ||
      tName.toLowerCase().includes(qLower)
    );
  }).slice(0, 4) : [];

  const filteredTeachers = qLower ? searchTeachers.filter(t => {
    const fname = t.first_name || t.teacher_first_name || '';
    const lname = t.last_name || t.teacher_last_name || '';
    const email = t.email || '';
    const dept = t.department || '';
    return (
      fname.toLowerCase().includes(qLower) ||
      lname.toLowerCase().includes(qLower) ||
      `${fname} ${lname}`.toLowerCase().includes(qLower) ||
      email.toLowerCase().includes(qLower) ||
      dept.toLowerCase().includes(qLower)
    );
  }).slice(0, 5) : [];

  const filteredStudents = qLower ? searchStudents.filter(s => {
    const fname = s.first_name || '';
    const lname = s.last_name || '';
    const cName = s.class_name || '';
    const sid = s.student_id || s.id || '';
    return (
      fname.toLowerCase().includes(qLower) ||
      lname.toLowerCase().includes(qLower) ||
      `${fname} ${lname}`.toLowerCase().includes(qLower) ||
      cName.toLowerCase().includes(qLower) ||
      s.external_student_id?.toLowerCase().includes(qLower) ||
      sid.toString().toLowerCase().includes(qLower)
    );
  }).slice(0, 6) : [];

  return (
    <header className="bg-[#151722] border-b border-[#262a3d] px-8 h-[73px] flex items-center sticky top-0 z-50 transition-colors">
      <div className="flex items-center justify-between w-full">
        {/* Left: Search Bar */}
        <div className="flex-1 max-w-md" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search teachers, classes, subjects, students..."
              value={searchQuery}
              onFocus={() => {
                setIsSearchOpen(true);
                loadSearchData();
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
                if (!dataLoaded) loadSearchData();
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
                {searchLoading && !dataLoaded ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">Loading search results...</div>
                ) : filteredClasses.length === 0 && filteredTeachers.length === 0 && filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No results found matching &quot;{searchQuery}&quot;</div>
                ) : (
                  <div className="space-y-4">
                    {/* Teachers Section - Placed FIRST when searching */}
                    {filteredTeachers.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Teachers</div>
                        <div className="mt-1 space-y-1">
                          {filteredTeachers.map((t) => {
                            const fname = t.first_name || t.teacher_first_name || 'Teacher';
                            const lname = t.last_name || t.teacher_last_name || '';
                            return (
                              <button
                                key={t.id || t.teacher_id}
                                onClick={() => {
                                  router.push(`/principal-teachers?tab=approved&q=${encodeURIComponent(`${fname} ${lname}`.trim())}`);
                                  setIsSearchOpen(false);
                                  setSearchQuery('');
                                }}
                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1b1e2c] transition-colors text-left group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-xs">
                                    {fname[0] || 'T'}{lname[0] || ''}
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors">
                                      {fname} {lname}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {t.department || 'Faculty'} {t.email ? `· ${t.email}` : ''} {t.class_count !== undefined ? `· ${t.class_count} classes` : ''}
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Classes & Subjects Section */}
                    {filteredClasses.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Classes & Subjects</div>
                        <div className="mt-1 space-y-1">
                          {filteredClasses.map((cls) => (
                            <button
                              key={cls.class_id}
                              onClick={() => {
                                router.push(`/principal-classes/${cls.class_id}`);
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
                                    {cls.grade_level ? `Grade ${cls.grade_level} · ` : ''}{cls.class_name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {cls.subject || 'General'} · Teacher: {cls.teacher_first_name} {cls.teacher_last_name}
                                  </div>
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
                          {filteredStudents.map((s) => {
                            const targetId = s.student_id || s.id;
                            return (
                              <button
                                key={targetId}
                                onClick={() => {
                                  router.push(`/principal-students/${targetId}`);
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
                                    Grade {s.grade_level} {s.external_student_id ? `· ID: ${s.external_student_id}` : ''}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                            </button>
                          );
                        })}
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


          {/* User Profile */}
          <div className="relative">
            <div 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 pl-4 border-l border-[#262a3d] cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-[#cbd5e1] text-slate-800 flex items-center justify-center font-bold text-sm">
                {userInitials}
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <span className="font-medium mr-1">{userName}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <p className="text-xs text-gray-600">Principal</p>
                </div>

                <button
                  onClick={() => {
                    router.push('/principal-settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-left text-sm"
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left text-sm border-t border-gray-200"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
