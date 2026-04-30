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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (typeof window === "undefined") {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "[Arena Web] Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    } else {
      console.log(`[Arena Web] Supabase configured: ${supabaseUrl}`);
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Vibrant Blue Paradise Background */}
        <div className="vibrant-background" />
        
        {/* Floating Particles */}
        <div className="vibrant-particles">
          <div className="vibrant-particle" />
          <div className="vibrant-particle" />
          <div className="vibrant-particle" />
          <div className="vibrant-particle" />
          <div className="vibrant-particle" />
          <div className="vibrant-particle" />
          <div className="vibrant-particle" />
        </div>

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* Glassmorphic Scrollable Card Container */}
          <div className="vibrant-content-wrapper p-[10px]">
            <div className="vibrant-glass-card p-0">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}


