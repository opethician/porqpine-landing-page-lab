import type { Metadata, Viewport } from "next";
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
  title: {
    default: "porQpine Landing Page Lab",
    template: "%s · porQpine",
  },
  description:
    "Plan one polished static responsive landing page for a tightly defined $10 scope.",
  applicationName: "porQpine Landing Page Lab",
  keywords: ["landing page", "static website", "responsive design", "HTML CSS JavaScript"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "porQpine Landing Page Lab",
    description: "A transparent brief builder for one static responsive landing page.",
    siteName: "porQpine",
  },
  twitter: {
    card: "summary",
    title: "porQpine Landing Page Lab",
    description: "Shape a clear, build-ready brief within a tightly defined $10 scope.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3f0e7",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
