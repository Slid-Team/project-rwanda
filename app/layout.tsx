import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RWANDA",
  description: "Trust Analysis for Real World Assets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-white">
        {/* Fixed Background with Gradient & Pattern */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          {/* Gradient Orbs */}
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#0071E3]/15 to-[#34C759]/12 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-[#0071E3]/12 to-[#34C759]/10 blur-3xl" />
          <div className="absolute top-[30%] left-[40%] w-[500px] h-[500px] rounded-full bg-gradient-to-r from-[#34C759]/10 to-[#0071E3]/10 blur-3xl" />

          {/* Grid Pattern - Animated */}
          <div
            className="absolute inset-0 opacity-[0.05] animate-grid-move"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 113, 227, 0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 113, 227, 0.5) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Apple-style minimal nav */}
        <nav className="backdrop-blur-xl bg-white/80 sticky top-0 z-50">
          <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-[28px] font-bold tracking-tight">
              <span className="text-accent-blue">RWA</span><span className="text-text-primary">NDA</span>
            </Link>
            <div className="flex items-center gap-8">
              <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                Overview
              </Link>
              <Link href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                API
              </Link>
            </div>
          </div>
        </nav>

        <main className="flex-1">
          {children}
        </main>

        <footer className="py-8">
          <div className="max-w-[1200px] mx-auto px-6">
            <p className="text-xs text-text-tertiary text-center">
              SEABW Hackathon 2026
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
