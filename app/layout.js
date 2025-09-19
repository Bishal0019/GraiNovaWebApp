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

export const metadata = {
  title: "GraiNova: Your Digital Farm Assistant",
  description: "A comprehensive web app providing Indian farmers with real-time weather alerts, personalized crop advisories, and detailed soil analysis reports to enhance productivity.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-green-100 p-6">
          <header className="text-center mb-12">
            <img src="/logo.png" alt="GraiNova Logo" className="mx-auto h-20" />
            <h1 className="text-3xl font-bold text-green-800">Smart Advisory System for Farmers</h1>
            <p className="mt-2 text-green-700">
              Multilingual AI-based crop guidance, pest detection, and market tracking
            </p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
