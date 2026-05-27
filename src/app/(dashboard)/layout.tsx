"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  CreditCard,
  LogOut,
  MousePointerClick,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";

const sidebarNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/sites", label: "Sites", icon: Globe },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 border-r bg-muted/30 md:block">
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <MousePointerClick className="h-4 w-4" />
            ClickPulse
          </Link>
        </div>
        <div className="flex flex-col h-[calc(100vh-3.5rem)] justify-between py-4">
          <nav className="space-y-1 px-3">
            {sidebarNav.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-3 space-y-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1">
        <header className="flex h-14 items-center justify-between border-b px-6 md:hidden">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <MousePointerClick className="h-4 w-4" />
            ClickPulse
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
