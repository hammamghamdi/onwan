import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const appUrl = "https://onwans.com";
const appDescription =
  "Onwan helps you share arrival instructions, map links, and entrance photos in one clear address link. عنوان يجمع تعليمات الوصول ورابط الخريطة وصور المدخل في رابط واحد.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Onwan | عنوان الوصول",
    template: "%s | Onwan",
  },
  description: appDescription,
  applicationName: "Onwan",
  alternates: {
    canonical: appUrl,
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Onwan | عنوان الوصول",
    description: appDescription,
    url: appUrl,
    siteName: "Onwan",
    type: "website",
    locale: "ar_SA",
  },
  twitter: {
    card: "summary",
    title: "Onwan | عنوان الوصول",
    description: appDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
