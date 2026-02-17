import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShowPrep",
  description: "Case-centric show planning for student crews"
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/cases", label: "Cases" },
  { href: "/shows", label: "Shows" },
  { href: "/crew", label: "Crew" },
  { href: "/scan", label: "Scan" },
  { href: "/load-plan", label: "Load Plan" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{ position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(8px)", background: "rgba(247,245,239,.88)", borderBottom: "1px solid #e5e1d7" }}>
          <main style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, paddingBottom: 12 }}>
            <div style={{ fontWeight: 800, letterSpacing: 0.4 }}>ShowPrep</div>
            <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "end" }}>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="badge">
                  {item.label}
                </Link>
              ))}
            </nav>
          </main>
        </header>
        {children}
      </body>
    </html>
  );
}
