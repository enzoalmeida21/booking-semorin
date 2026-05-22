import Link from "next/link";
import { Camera, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  nav?: { href: string; label: string }[];
  onLogout?: () => void;
}

export function AppShell({
  children,
  title = "Book de Fotos Trade Marketing",
  subtitle,
  nav = [],
  onLogout,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          <nav className="flex items-center gap-2 flex-wrap">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" size="sm">
                  {item.label}
                </Button>
              </Link>
            ))}
            {onLogout && (
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
