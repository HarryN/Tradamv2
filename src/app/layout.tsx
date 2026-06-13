import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/features/auth/context/auth-context";
import { LanguageProvider } from "@/hooks/useLanguage";
import Header from '@/components/Header';
import MobileTabBar from '@/components/MobileTabBar';

export const metadata: Metadata = {
  title: "Tradam | Cameroon Multi-Vendor E-Commerce Platform",
  description: "Discover and purchase quality products from local sellers in Cameroon, powered by Tradam.",
  themeColor: "#ffffff",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "icon",
        url: "/favicon-16x16.png",
        sizes: "16x16",
      },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans bg-neutral-bg text-neutral-text">
        <AuthProvider>
          <LanguageProvider>
            <Header />
            <main className="flex-1 pb-20 md:pb-0">
              {children}
            </main>
            <MobileTabBar />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

