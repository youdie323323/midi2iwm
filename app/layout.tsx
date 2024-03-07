import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from 'next/script'
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "I Wanna Maker Tools",
  description: "Tools for IWM, made by youdi3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Script strategy='beforeInteractive' src='wasm_exec.js' />
      <body className={inter.className}>{children}</body>
    </html>
  );
}