import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { EmDashGuard } from "@/components/em-dash-guard";

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
  title: "Max Winter-Leinweber",
  description: "The personal site of Max Winter-Leinweber.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <EmDashGuard />
        {children}
      </body>
    </html>
  );
}
