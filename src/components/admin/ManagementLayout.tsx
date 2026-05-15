import * as React from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import {
    Users,
    Building2,
    CreditCard,
    MessageSquareWarning,
    ScrollText,
    LayoutDashboard,
    ShieldCheck,
    FileText,
    DollarSign,
    Megaphone,
    Database
} from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
    { title: "Dashboard",     href: "/admin",              icon: LayoutDashboard },
    { title: "Financeiro",    href: "/admin/finance",      icon: DollarSign },
    { title: "Comunicação",   href: "/admin/communication", icon: Megaphone },
    { title: "Importações",   href: "/admin/imports",       icon: Database },
    { title: "Usuários",      href: "/admin/users",         icon: Users },
    { title: "Instituições",  href: "/admin/institutions",  icon: Building2 },
    { title: "Editais",       href: "/admin/edicts",        icon: FileText },
    { title: "Planos",        href: "/admin/plans",         icon: CreditCard },
    { title: "Moderação",     href: "/admin/moderation",    icon: MessageSquareWarning },
    { title: "Logs de Auditoria", href: "/admin/audit-logs", icon: ScrollText },
]

export default function ManagementLayout() {
    const location = useLocation()

    const activeItem = sidebarItems.find(i => i.href === location.pathname)

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-60 border-r border-border/60 bg-card flex flex-col relative overflow-hidden">
                {/* Subtle mesh gradient behind the sidebar */}
                <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />

                <div className="relative p-5 flex items-center gap-2.5 border-b border-border/50">
                    <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <span className="font-black text-sm text-foreground" style={{ letterSpacing: '-0.02em' }}>Gestão</span>
                        <p className="label-pill text-muted-foreground leading-none">Painel Admin</p>
                    </div>
                </div>

                <nav className="relative flex-1 px-3 py-4 space-y-0.5">
                    {sidebarItems.map((item) => {
                        const isActive = location.pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-primary/15 text-primary border border-primary/25"
                                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent"
                                )}
                            >
                                {/* Active left bar */}
                                {isActive && (
                                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />
                                )}
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span>{item.title}</span>
                            </Link>
                        )
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-14 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center px-8 gap-3">
                    {activeItem && <activeItem.icon className="h-4 w-4 text-primary" />}
                    <h2 className="font-bold text-sm" style={{ letterSpacing: '-0.01em' }}>
                        {activeItem?.title ?? "Gestão Centralizada"}
                    </h2>
                </header>
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
