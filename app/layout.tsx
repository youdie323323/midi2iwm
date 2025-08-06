import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script"
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "MIDI to IWM",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <Script strategy="beforeInteractive" src="/wasm_exec.js" type="module" crossOrigin="anonymous" />

                <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"></link>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"></link>
                <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v6.6.0/css/all.css" />
                <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v6.6.0/css/sharp-solid.css" />
                <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v6.6.0/css/sharp-regular.css" />
                <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v6.6.0/css/sharp-light.css" />
                <link rel="preconnect" href="https://fonts.googleapis.com"></link>
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""></link>
                <link href="https://fonts.googleapis.com/css2?family=Quantico&amp;display=swap" rel="stylesheet"></link>
                <link href="https://fonts.googleapis.com/css2?family=League+Spartan&amp;display=swap" rel="stylesheet"></link>
                <link href="https://fonts.googleapis.com/css2?family=Inconsolata&amp;display=swap" rel="stylesheet"></link>
            </head>

            <body className={inter.className}>
                {children}

                <Analytics />
            </body>
        </html>
    );
}