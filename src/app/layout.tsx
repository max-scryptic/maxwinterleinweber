import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

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

// The display face: the name, the greeting and the section headings. A single
// weight, in both its upright and italic, which is all a serif set this large
// needs; the italic is the name inside the greeting.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://maxwinterleinweber.com"),
  title: "Max Winter-Leinweber",
  description:
    "Max Winter-Leinweber is a full-stack developer and the founder of Scryptic, building apps for founders, his own SaaS products, videos and music.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <EmDashGuard />
        {children}
      </body>
    </html>
  );
}
