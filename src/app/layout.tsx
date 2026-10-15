import type { Metadata } from "next";
import { Rubik, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://accessibility.dymaptic.ai"),
  title: "Accessible Map Agent | dymaptic",
  description: "Generate accessibility descriptions for ArcGIS web maps using AI. Designed to support WCAG 2.1 Level AA guidelines.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Accessible Map Agent | dymaptic",
    description: "Generate accessibility descriptions for ArcGIS web maps using AI. Designed to support WCAG 2.1 Level AA guidelines.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "dymaptic Accessible Map Agent",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Accessible Map Agent | dymaptic",
    description: "Generate accessibility descriptions for ArcGIS web maps using AI. Designed to support WCAG 2.1 Level AA guidelines.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${rubik.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
