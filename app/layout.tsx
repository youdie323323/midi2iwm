import type { Metadata } from "next";
import Script from 'next/script'

export const metadata: Metadata = {
  title: "I Wanna Maker Tools",
  description: "Tools for IWM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Script strategy='beforeInteractive' src='wasm_exec.js' />
      <body>{children}</body>
    </html>
  );
}
