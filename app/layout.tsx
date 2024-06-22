import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from 'next/script'
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "I Wanna Maker Tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/wasm_exec.js" as="script" crossOrigin="anonymous" />
        <Script strategy='beforeInteractive' src='/wasm_exec.js' type="module" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"></link>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"></link>
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
        <input type="file" id="upload" />
        <canvas id="canvas" width="800" height="608"></canvas>
      </body>
    </html>
  );
}
