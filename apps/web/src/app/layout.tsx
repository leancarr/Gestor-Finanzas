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
export const viewport: Viewport = {
  themeColor: "#020617",
};

export const metadata: Metadata = {
  title: "Gestor Guita | Tracking Financiero Inteligente",
  description: "Sistema de tracking financiero personal optimizado para contextos multi-moneda y cargas rápidas mediante Inteligencia Artificial.",
  manifest: "/manifest.json",
};

import SyncManager from "@/components/SyncManager";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        {children}
        <SyncManager />
      </body>
    </html>
  );
}
