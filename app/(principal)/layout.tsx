'use client';

import PrincipalSidebar from "@/components/PrincipalSidebar";
import PrincipalHeader from "@/components/PrincipalHeader";
import { useAuth } from "@/app/providers";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PrincipalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🔍 Principal Layout - Checking auth:', { loading, userEmail: user?.email, userRole: user?.role });
    
    // Redirect to principal auth if user is not logged in or not an admin
    if (!loading && (!user || user.role !== 'admin')) {
      console.log('⛔ Access denied - redirecting to principal-auth');
      console.log('  Reason:', !user ? 'No user logged in' : `Wrong role: ${user.role}`);
      router.push('/principal-auth');
    } else if (!loading && user && user.role === 'admin') {
      console.log('✅ Admin access granted - showing principal dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50" style={{ minHeight: '100vh' }}>
      <PrincipalSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <PrincipalHeader />
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 via-white to-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
