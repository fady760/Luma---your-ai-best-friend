"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  MessageSquare,
  Book,
  Search,
  BrainCircuit,
  Settings,
  LogOut,
  Menu,
  X,
  Mic,
  Home
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0f]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(168,85,247,0.3)] border-t-[#a855f7]"></div>
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Journal", href: "/journal", icon: Book },
    { name: "Search", href: "/search", icon: Search },
    { name: "Memories", href: "/memories", icon: BrainCircuit },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0f] text-[#f5f5f5] overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[rgba(255,255,255,0.08)] bg-[#13111c]/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(124,58,237,0.3)] to-[rgba(168,85,247,0.15)] border border-[rgba(168,85,247,0.2)] text-[#c084fc] shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Mic size={16} />
            </div>
            <span className="text-xl font-bold tracking-tight">Luma</span>
          </Link>
          <button
            className="lg:hidden text-[#a1a1aa] hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[rgba(168,85,247,0.15)] text-[#c084fc] border border-[rgba(168,85,247,0.3)] shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                    : "text-[#a1a1aa] hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon size={18} className={isActive ? "text-[#a855f7]" : ""} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[rgba(255,255,255,0.08)] p-4">
          <div className="mb-4 flex items-center gap-3 px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,255,255,0.1)] text-sm font-bold">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium">{user?.username}</span>
              <span className="truncate text-xs text-[#a1a1aa]">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-[#a1a1aa] transition-colors hover:bg-[rgba(248,113,113,0.1)] hover:text-[#f87171]"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-[#13111c]/80 px-4 backdrop-blur-md lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(124,58,237,0.3)] to-[rgba(168,85,247,0.15)] border border-[rgba(168,85,247,0.2)] text-[#c084fc]">
              <Mic size={14} />
            </div>
            <span className="text-lg font-bold">Luma</span>
          </Link>
          <button
            className="text-[#a1a1aa] hover:text-white p-2"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[url('/bg-pattern.svg')] bg-repeat">
          <div className="mx-auto max-w-5xl p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
