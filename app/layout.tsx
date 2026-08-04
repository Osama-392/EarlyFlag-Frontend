'use client';

import { Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/providers";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "next-themes";

const sora = Sora({ 
  subsets: ["latin"],
  variable: '--font-sora',
});

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en" suppressHydrationWarning>
 <head>
 <link rel="icon" href="/favicon.ico" />
 </head>
 <body className={`${sora.variable} ${sora.className} font-sans`}>
 <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
 <AuthProvider>
 <ToastProvider>
 {children}
 </ToastProvider>
 </AuthProvider>
 </ThemeProvider>
 </body>
 </html>
 );
}
