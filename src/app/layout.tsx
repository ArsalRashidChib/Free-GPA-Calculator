import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Free College GPA Calculator | Fast, Cumulative & Weighted GPA Tool",
  description:
    "Calculate semester and cumulative college or high school GPA instantly. Supports weighted Honors, AP/IB scaling, credit hours, and target GPA forecasting.",
  keywords: [
    "GPA Calculator",
    "College GPA Calculator",
    "Cumulative GPA Tool",
    "High School Grade Calculator",
    "Weighted GPA",
    "Target GPA Forecaster",
  ],
  openGraph: {
    title: "Free GPA Calculator | Fast, Cumulative & Weighted Tool",
    description:
      "Instant, privacy-friendly GPA calculator with weighted course support and semester target planning.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}