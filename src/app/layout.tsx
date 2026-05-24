import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { QuickEntryModal } from "@/components/QuickEntryModal";
import { SecurityLockScreen } from "@/components/SecurityLockScreen";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { MobileHeader, MobileBottomBar } from "@/components/MobileNav";
import { ToastProvider } from "@/components/ToastProvider";
import { AutoLogEngine } from "@/components/AutoLogEngine";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Cashhero - Personal Finance Tracker",
  description: "A premium and modern personal finance tracker application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} antialiased flex h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-300`}
      >
        <ToastProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AutoLogEngine />
            <DesktopSidebar />
            
            <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
              <MobileHeader />
              <div className="max-w-5xl mx-auto w-full p-4 sm:p-8">
                {children}
              </div>
              <QuickEntryModal />
              <SecurityLockScreen />
              <MobileBottomBar />
            </main>
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

