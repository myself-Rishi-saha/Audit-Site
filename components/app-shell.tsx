"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  SlidersHorizontal,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const links = [
  { label: "Dashboard", href: "/employee", icon: LayoutDashboard },
  { label: "Audits", href: "/employee/audits/new", icon: ClipboardCheck },
  {
    label: "Service Reports",
    href: "/employee/service-reports/new",
    icon: Wrench,
  },
  {
    label: "Form Templates",
    href: "/admin/form-templates",
    icon: SlidersHorizontal,
  },
];

export function AppShell({
  children,
  title = "AuditDesk",
  user,
}: {
  children: React.ReactNode;
  title?: string;
  user?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const displayName = user?.split(" · ")[0] || "S. Roy";
  const isAdmin = user?.includes("Admin");

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => router.push(isAdmin ? "/admin" : "/employee")}
            className="flex items-center gap-3 text-left font-semibold tracking-tight"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <ClipboardCheck />
            </span>
            <span className="text-lg">{title}</span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X />
          </Button>
        </div>
        <p className="mt-10 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/55">
          Workspace
        </p>
        <nav className="mt-3 flex flex-col gap-1">
          {links
            .filter((link) => !isAdmin || (link.label !== "Audits" && link.label !== "Service Reports"))
            .map(({ label, href, icon: Icon }) => {
              const active =
                pathname === href ||
                (href !== "/employee" &&
                  pathname.startsWith(href.split("/new")[0]));
              return (
                <button
                  key={label}
                  onClick={() => {
                    router.push(
                      isAdmin && label === "Dashboard" ? "/admin" : href,
                    );
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"}`}
                >
                  <Icon className={active ? "text-sidebar-primary" : ""} />
                  {label}
                </button>
              );
            })}
        </nav>
        <div className="mt-auto border-t border-sidebar-border pt-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent">
            <Settings />
            Settings
          </button>
          <button
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent"
          >
            <LogOut />
            Sign out
          </button>
        </div>
      </aside>
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </Button>
            <div>
              <p className="text-sm font-semibold">
                {pathname === "/employee" || pathname === "/admin"
                  ? "Dashboard"
                  : "AuditDesk"}
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Inspection operations workspace
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
            >
              <Bell />
            </Button>
            <div className="hidden h-7 w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                {displayName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none">
                  {displayName}
                </p>
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {isAdmin ? "Admin" : "Auditor"}
                </Badge>
              </div>
              <UserRound className="hidden text-muted-foreground sm:block" />
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
