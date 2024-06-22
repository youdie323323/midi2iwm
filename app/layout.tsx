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
        <Script strategy='beforeInteractive' src='/wasm_exec.js' type="module" crossOrigin="anonymous" onLoad={() => {
          eval(`
          function base64Encode(input) {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result.split(',')[1]);
              reader.onerror = error => reject(error);
              reader.readAsDataURL(input);
            });
          }

          document.getElementById('upload')?.addEventListener('change', async (event) => {
            const file = event.target?.files[0];
            if (file) {
              const base64Str = await base64Encode(file);
              const objects = window.__iwm_wasm_exports.image(base64Str, 800, 608, 0.6, 7);
              drawObjects(objects);
            }
          });

          function drawObjects(objects) {
            const canvas = document.getElementById('canvas');
            const ctx = canvas?.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            objects.forEach((obj) => {
              ctx.beginPath();
              ctx.arc(obj.x, obj.y, obj.scale * 10, 0, 2 * Math.PI, false);
              ctx.fillStyle = "#" + obj.color.toString(16).padStart(6, '0');
              ctx.fill();
              ctx.closePath();
            });
          }
          `)
        }} />
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
