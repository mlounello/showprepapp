import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShowPrep",
  description: "Case-centric show planning for student crews"
};

const navItems = [
  { href: "/" as Route, label: "Home" },
  { href: "/cases" as Route, label: "Cases" },
  { href: "/shows" as Route, label: "Shows" },
  { href: "/crew" as Route, label: "Crew" },
  { href: "/scan" as Route, label: "Scan" },
  { href: "/load-plan" as Route, label: "Load Plan" },
  { href: "/admin" as Route, label: "Admin" }
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
