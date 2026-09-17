import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getSession } from "@/lib/auth";
import { siteUrl } from "@/lib/site";
import { themeInitScript } from "@/lib/theme";

export const runtime = "nodejs";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className={`${inter.className} min-h-full flex flex-col antialiased`}>
        <Script id="workora-theme" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Header user={session} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
