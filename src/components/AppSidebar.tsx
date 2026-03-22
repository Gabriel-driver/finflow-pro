import { LayoutDashboard, Wallet, ArrowLeftRight, Tags, Target, LogOut, CreditCard, CalendarDays, Bell, Settings, FileBarChart, DollarSign } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useFinance, clearAuth } from "@/lib/finance-store";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navSections = [
  {
    key: "overview",
    title: "Visão Geral",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    key: "management",
    title: "Gestão",
    items: [
      { title: "Contas", url: "/accounts", icon: Wallet },
      { title: "Transações", url: "/transactions", icon: ArrowLeftRight },
      { title: "Cartões", url: "/credit-cards", icon: CreditCard },
    ],
  },
  {
    key: "planning",
    title: "Planejamento",
    items: [
      { title: "Categorias", url: "/categories", icon: Tags },
      { title: "Orçamentos", url: "/budgets", icon: DollarSign },
      { title: "Metas", url: "/goals", icon: Target },
      { title: "Planejamento Mensal", url: "/monthly-plan", icon: CalendarDays },
    ],
  },
  {
    key: "analytics",
    title: "Análises",
    items: [{ title: "Relatórios", url: "/reports", icon: FileBarChart }],
  },
  {
    key: "extras",
    title: "Extras",
    items: [
      { title: "Notificações", url: "/notifications", icon: Bell },
      { title: "Configurações", url: "/settings", icon: Settings },
    ],
  },
];


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { getUnreadNotifications, settings } = useFinance();
  const unread = getUnreadNotifications();
  // Sempre mantém uma seção aberta (acordeão)
  const [openSection, setOpenSection] = useState<string>(() => {
    // Se a rota atual pertence a alguma seção, abre ela; senão, abre a primeira
    const found = navSections.find(section => section.items.some(item => location.pathname === item.url));
    return found?.key || navSections[0]?.key || "";
  });

  // Atualiza a seção aberta ao navegar para uma rota de outra seção
  useEffect(() => {
    const found = navSections.find(section => section.items.some(item => location.pathname === item.url));
    if (found && found.key !== openSection) {
      setOpenSection(found.key);
    }
  }, [location.pathname]);

  const systemName = settings.systemName || "Continhas da Duda";

  // Só muda a seção aberta ao clicar no header de outro grupo
  // Só muda a seção aberta ao clicar no header de outro grupo
  const toggleSection = (key: string) => {
    setOpenSection((current) => (current === key ? current : key));
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-gradient-to-br from-slate-900/70 via-slate-950/80 to-slate-900/80 backdrop-blur-md shadow-2xl overflow-hidden">
      <SidebarContent>
        <div className="pointer-events-none absolute inset-0">
          <span className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-cyan-400/25 blur-2xl animate-blob" />
          <span className="absolute -right-10 top-1/4 h-28 w-28 rounded-full bg-blue-500/20 blur-2xl animate-blob-slow" />
          <span className="absolute left-1/3 bottom-8 h-36 w-36 rounded-full bg-violet-500/15 blur-2xl animate-blob-slower" />
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-5">
            {!collapsed ? (
              <span className="text-base font-bold tracking-tight text-gradient whitespace-nowrap">{systemName}</span>
            ) : (
              <span className="text-lg font-bold text-primary">{systemName[0] || "F"}</span>
            )}
          </SidebarGroupLabel>
        </SidebarGroup>

        {navSections.map((section, sectionIndex) => {
          const sectionOpen = openSection === section.key;
          return (
            <SidebarGroup key={section.key} className="will-change-transform">
              <SidebarGroupLabel className="px-3 py-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className={`w-full flex items-center justify-between gap-2 rounded-xl border border-primary/10 bg-white/5 px-3 py-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-all hover:border-primary/40 hover:bg-white/10 hover:text-primary ${sectionOpen ? "bg-primary/10 border-primary/30 text-primary" : ""}`}
                >
                  <span>{section.title}</span>
                  <span className={`inline-block transition-transform duration-200 ${sectionOpen ? "rotate-180" : "rotate-0"}`}>
                    ▾
                  </span>
                </button>
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out ${sectionOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-5"}`}>
                  {section.items.map((item, itemIndex) => {
                    const isActive = location.pathname === item.url;
                    const showBadge = item.url === "/notifications" && unread > 0;
                    return (
                      <SidebarMenuItem key={item.title} className="">
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-150 ${
                              isActive
                                ? "bg-primary/15 text-primary font-semibold border border-primary/30"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                            }`}
                            style={{
                              transitionDelay: `${itemIndex * 20}ms`,
                            }}
                            // Não altera o acordeão ao clicar em item
                          >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {!collapsed && <span className="font-medium">{item.title}</span>}
                            {showBadge && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                {unread}
                              </span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={() => {
                  clearAuth();
                  navigate("/login");
                  setTimeout(() => window.location.reload(), 100);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 w-full"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="font-medium">Sair</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
