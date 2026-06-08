import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ThemeProvider from "@/app/components/ThemeProvider";

const dubai = localFont({
  src: [
    { path: "../public/fonts/Dubai-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Dubai-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/Dubai-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-dubai",
});

export const metadata: Metadata = {
  title: "البيان الإخباري — من قلب الحدث",
  description:
    "منصة ميدانية مستقلة لعرض التنبيهات والأحداث المهمة على الخريطة بشكل مباشر في لبنان. تابع الغارات، التهديدات، والتحديثات الميدانية لحظة بلحظة.",
  keywords: ["البيان", "خريطة", "تنبيهات", "لبنان", "أخبار", "ميدانية", "AlBayan", "Lebanon", "alerts", "map"],
  manifest: "/manifest.json",
  openGraph: {
    title: "البيان الإخباري — من قلب الحدث",
    description: "منصة ميدانية مستقلة لعرض التنبيهات والأحداث المباشرة على الخريطة في لبنان.",
    type: "website",
    locale: "ar_LB",
    url: "https://albayan-website-news.vercel.app",
    siteName: "البيان الإخباري",
  },
  twitter: { card: "summary_large_image", title: "البيان الإخباري", description: "خريطة التنبيهات المباشرة — لبنان" },
  other: { "apple-mobile-web-app-capable": "yes", "apple-mobile-web-app-status-bar-style": "black-translucent" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" data-theme="dark" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0A1628" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/new_logo.jpg" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('albayan-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);var l=localStorage.getItem('albayan-lang');if(l==='en'){document.documentElement.dir='ltr';document.documentElement.lang='en'}}catch(e){}})()` }} />
      </head>
      <body className={dubai.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
