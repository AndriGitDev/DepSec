import type { Metadata } from "next";
import { Inter, Orbitron, Share_Tech_Mono } from "next/font/google";
import Script from "next/script";
import { Header } from "@/components/layout/Header";
import { ScanlineOverlay } from "@/components/layout/ScanlineOverlay";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-share-tech-mono",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "DepSec - Dependency Security Analyzer",
  description:
    "Upload your package.json and get a security score from 0 to 100. Analyze vulnerabilities, license risks, maintainer health, and more.",
  openGraph: {
    title: "DepSec - Dependency Security Analyzer",
    description:
      "Upload your package.json and get a security score from 0 to 100.",
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
        className={`${inter.variable} ${orbitron.variable} ${shareTechMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ScanlineOverlay />
        <Header />
        <main className="pt-14">{children}</main>
        <Script src="https://swetrix.org/swetrix.js" strategy="afterInteractive" />
        <Script id="swetrix-init" strategy="afterInteractive">
          {`
            document.addEventListener('DOMContentLoaded', function() {
              if (window.swetrix) {
                swetrix.init('NTjzOAzBYjDt', {
                  apiURL: 'https://swetrixapi.kindra.is/log',
                });
                swetrix.trackViews();
              }
            });
            if (document.readyState !== 'loading' && window.swetrix) {
              swetrix.init('NTjzOAzBYjDt', {
                apiURL: 'https://swetrixapi.kindra.is/log',
              });
              swetrix.trackViews();
            }
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://swetrixapi.kindra.is/log/noscript?pid=NTjzOAzBYjDt"
            alt=""
            referrerPolicy="no-referrer-when-downgrade"
          />
        </noscript>
      </body>
    </html>
  );
}
