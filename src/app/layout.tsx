import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "pemily执行智能体",
  description: "专业的宠物活动策划与执行管理平台，提供项目管理、物料管理、人员管理、运动会计时、验收报告等全方位功能",
  keywords: ["宠物活动", "活动策划", "智能化平台", "项目管理", "pemily"],
  authors: [{ name: "Pemily Team" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "pemily执行智能体",
    description: "专业的宠物活动策划与执行管理平台",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
