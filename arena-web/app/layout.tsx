import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arena Homes | Find Your Ideal Space",
  description: "Experience modern living with Arena Homes. Premium listings, verified hosts, and seamless rental experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Validate Environment
  if (typeof window === 'undefined') {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.error("❌ CRITICAL: NEXT_PUBLIC_API_URL is invalid or missing!");
      // In dev we might want to throw, in prod we might handle gracefully or fail build
      if (process.env.NODE_ENV === 'development') {
        throw new Error("NEXT_PUBLIC_API_URL is missing in .env.local");
      }
    } else {
      console.log(`✅ Arena Web connected to API: ${apiUrl}`);
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}


