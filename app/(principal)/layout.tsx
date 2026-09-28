'use client';

import PrincipalSidebar from "@/components/PrincipalSidebar";
import PrincipalHeader from "@/components/PrincipalHeader";
import { useAuth } from "@/app/providers";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminWorkspaceSkeleton } from "@/components/AdminLoadingSkeletons";

export default function PrincipalLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 const { user, loading } = useAuth();
 const router = useRouter();

 useEffect(() => {
 console.log('🔍 Principal Layout - Checking auth:', { loading, userEmail: user?.email, userRole: user?.role });
 
 const normalizedRole = user?.role ? user.role.trim().toLowerCase() : null;
 const isAdmin = normalizedRole === 'admin' || normalizedRole === 'principal';

 // Redirect to principal auth if user is not logged in or not an admin/principal
 if (!loading && (!user || !isAdmin)) {
 console.log('⛔ Access denied - redirecting to principal-auth');
 console.log(' Reason:', !user ? 'No user logged in' : `Wrong role: ${user.role}`);
 router.push('/principal-auth');
 } else if (!loading && user && isAdmin) {
 console.log('✅ Admin access granted - showing principal dashboard');
 }
 }, [user, loading, router]);

 if (loading) {
 return (
 <main className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 dark:from-[#0f111a] dark:via-[#151722] dark:to-[#0f111a]">
 <AdminWorkspaceSkeleton label="Loading admin workspace content" />
 </main>
 );
 }

 const normalizedRole = user?.role ? user.role.trim().toLowerCase() : null;
 const isAdmin = normalizedRole === 'admin' || normalizedRole === 'principal';
 if (!user || !isAdmin) {
 return null;
 }

 return (
 <div className="flex h-screen bg-gray-50 dark:bg-[#0f111a]" style={{ minHeight: '100vh' }}>
 <PrincipalSidebar />
 <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0f111a]">
 <PrincipalHeader />
 <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-[#0f111a] dark:via-[#151722] dark:to-[#0f111a] transition-colors">
 {children}
 </main>
 </div>
 </div>
 );
}
