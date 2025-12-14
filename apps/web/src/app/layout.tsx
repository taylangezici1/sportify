import type { Metadata } from "next";
import { Lato, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MiniPlayer from "@/components/MiniPlayer";
import Providers from "@/components/Providers";
import { Toaster } from "react-hot-toast";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sportify",
  description: "Clip your favorite parts of songs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lato.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        <Providers>
          <div className="flex flex-col h-dvh">
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </div>
            <MiniPlayer />
          </div>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
