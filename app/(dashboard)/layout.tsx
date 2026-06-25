'use client';

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/app/providers";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
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
