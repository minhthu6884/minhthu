import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Phần mềm Quản lý Phòng",
  description: "Hệ thống quản lý phòng và doanh thu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body 
        suppressHydrationWarning 
        className={`${inter.className} bg-slate-50 text-slate-800 antialiased h-screen overflow-hidden flex flex-col`}
      >
        <main className="flex-1 flex overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}