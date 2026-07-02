'use client';

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/app/providers";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const normalizedRole = user?.role ? user.role.trim().toLowerCase() : null;
    const isAdmin = normalizedRole === 'admin' || normalizedRole === 'principal';

    if (!loading && (!user || isAdmin)) {
      console.log('⛔ Teacher access denied - redirecting');
      if (isAdmin) {
        // If an admin tries to visit teacher dashboard, redirect them to principal dashboard
        router.push('/principal-dashboard');
      } else {
        // If not logged in, redirect to teacher auth
        router.push('/auth');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const normalizedRole = user?.role ? user.role.trim().toLowerCase() : null;
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'principal';
  if (!user || isAdmin) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f111a]" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0f111a]">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-[#0f111a] dark:via-[#151722] dark:to-[#0f111a] transition-colors">
          {children}
        </main>
      </div>
    </div>
  );
}
