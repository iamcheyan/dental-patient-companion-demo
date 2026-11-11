import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "デンタル・ペイシェント・コンパニオン デモ",
  description:
    "歯科患者向け AI コンパニオン・デモ（モックデータ / magpie/default）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[radial-gradient(ellipse_at_top,_#e0f2fe_0%,_#f8fafc_45%,_#f1f5f9_100%)] text-slate-900">
        {children}
      </body>
    </html>
  );
}
