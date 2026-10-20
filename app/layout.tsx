import type { ReactNode } from "react";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getSession } from "@/lib/auth";
import { countUnreadMessages } from "@/app/actions/messages";
import { siteUrl } from "@/lib/site";
import { themeInitScript } from "@/lib/theme";
import { AdminSkillAlert } from "@/components/admin-skill-alert";

export const runtime = "nodejs";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Wova — Great jobs. Better future.",
  description:
    "Discover opportunities, build your skills, and advance your career. Clients hire verified talent on Wova.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Wova",
    locale: "en_US",
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=workora", type: "image/x-icon" },
      { url: "/icon.png?v=workora", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-icon.png?v=workora",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className={`${inter.className} min-h-full flex flex-col antialiased`}>
        <Script id="workora-theme" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Suspense fallback={null}>
          <SessionChrome />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

async function SessionChrome() {
  const session = await getSession();
  const unreadCount = session ? await countUnreadMessages(session.id) : 0;
  return (
    <>
      <Header user={session} unreadCount={unreadCount} />
      {session?.role === "ADMIN" ? <AdminSkillAlert /> : null}
    </>
  );
}
