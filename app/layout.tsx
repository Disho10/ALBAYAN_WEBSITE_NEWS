import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const dubai = localFont({
  src: [
    {
      path: "../public/fonts/Dubai-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Dubai-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Dubai-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-dubai",
});

export const metadata: Metadata = {
  title: "AlBayan Alert Map — خريطة تنبيهات البيان",
  description:
    "منصة ميدانية مستقلة لعرض التنبيهات والأحداث المهمة على الخريطة بشكل مباشر في لبنان. تابع الغارات، التهديدات، والتحديثات الميدانية لحظة بلحظة.",
  keywords: ["البيان", "خريطة", "تنبيهات", "لبنان", "أخبار", "ميدانية"],
  openGraph: {
    title: "AlBayan Alert Map — خريطة تنبيهات البيان",
    description:
      "منصة ميدانية مستقلة لعرض التنبيهات والأحداث المباشرة على الخريطة في لبنان.",
    type: "website",
    locale: "ar_LB",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className={dubai.className}>{children}</body>
    </html>
  );
}
