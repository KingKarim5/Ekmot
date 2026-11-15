/**
 * Sidebar Component
 * 
 * Side navigation component for dashboard pages.
 * Provides navigation links based on user role.
 * 
 * @param role - User role to determine which navigation items to show
 * @param currentPath - Current route path for active link highlighting
 */

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@/types";

interface SidebarProps {
  role: UserRole;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  /**
   * Navigation items configuration based on user role
   * Each role has different dashboard sections they can access
   */
  const getNavItems = () => {
    switch (role) {
      case "tenant":
        return [
          { href: "/dashboard/tenant", label: "My Property", icon: "🏠" },
          { href: "/dashboard/tenant/agreements", label: "Agreements", icon: "🤝" },
          { href: "/dashboard/tenant/receipts", label: "Rent Receipts (SMS)", icon: "🧾" },
          { href: "/dashboard/tenant/share", label: "Share My Record", icon: "🔗" },
          { href: "/dashboard/tenant/payments", label: "Payment History", icon: "📋" },
          { href: "/dashboard/tenant/maintenance", label: "Maintenance", icon: "🔧" },
          { href: "/dashboard/tenant/notices", label: "Notices", icon: "📢" },
          { href: "/dashboard/tenant/reviews", label: "Reviews", icon: "⭐" },
        ];
      case "landlord":
        return [
          { href: "/dashboard/landlord", label: "Properties", icon: "🏘️" },
          { href: "/dashboard/landlord/properties/add", label: "Add Property", icon: "➕" },
          { href: "/dashboard/landlord/agreements", label: "Agreements", icon: "🤝" },
          { href: "/dashboard/landlord/rentals", label: "Rentals", icon: "📋" },
          { href: "/dashboard/landlord/receipts", label: "Rent Receipts (SMS)", icon: "🧾" },
          { href: "/dashboard/landlord/renewals", label: "Renewal Requests", icon: "🔄" },
          { href: "/dashboard/landlord/payments", label: "Payments", icon: "💰" },
          { href: "/dashboard/landlord/maintenance", label: "Maintenance", icon: "🔧" },
          { href: "/dashboard/landlord/notices", label: "Notices", icon: "📢" },
          { href: "/dashboard/landlord/terms", label: "Terms & Conditions", icon: "📄" },
          { href: "/dashboard/landlord/reviews", label: "Reviews", icon: "⭐" },
        ];
      case "bank":
        return [
          { href: "/dashboard/bank", label: "Rent Records", icon: "📊" },
          { href: "/dashboard/bank/credit", label: "How Rent Records Work", icon: "ℹ️" },
        ];
      case "ministry":
        return [
          { href: "/dashboard/ministry", label: "Analytics", icon: "📈" },
          { href: "/dashboard/ministry/compliance", label: "Compliance", icon: "✅" },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  /**
   * Determines if a navigation link is currently active
   * Used for highlighting the active page in the sidebar
   */
  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

