import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HomepageBackground } from "@/components/HomepageBackground";
import { HomepageRouteShell } from "@/components/HomepageRouteShell";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <HomepageRouteShell>
            <HomepageBackground />
            <Navbar />
            <main className="min-h-screen">
                {children}
            </main>
            <Footer />
        </HomepageRouteShell>
    );
}
