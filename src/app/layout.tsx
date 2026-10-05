import type { Metadata } from "next";
import Link from "next/link";
import { UserRound } from "lucide-react";
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
  title: "Clubin Tickets",
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
      <body className="flex min-h-full flex-col">
        <header className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
          <Brand />
          <Link
            href="/cuenta"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground"
          >
            <UserRound size={16} />
            Mi cuenta
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
