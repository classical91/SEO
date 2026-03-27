import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"]
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"]
});

export const metadata: Metadata = {
  title: "RankForge",
  description: "AI-assisted technical SEO platform for audits, performance, and fix prioritization."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${plexMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
