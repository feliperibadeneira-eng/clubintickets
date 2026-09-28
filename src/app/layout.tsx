import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Brand } from "@/components/Brand";
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
  title: "Ticketera",
  description: "Entradas para las mejores fiestas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="ambient-glow flex min-h-full flex-col">
        <header className="border-b border-border/60 px-4 py-3.5">
          <Brand />
        </header>
        {children}
      </body>
    </html>
  );
}
