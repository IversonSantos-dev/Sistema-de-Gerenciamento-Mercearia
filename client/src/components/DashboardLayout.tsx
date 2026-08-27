import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertTriangle,
  Archive,
  ChevronRight,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  RefreshCw,
  Store,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";

const navigation = [
  { label: "Visão geral", path: "/", icon: LayoutDashboard },
  { label: "Ponto de venda", path: "/pdv", icon: ReceiptText },
  { label: "Produtos", path: "/produtos", icon: PackageSearch },
  { label: "Importar planilha", path: "/importar", icon: FileSpreadsheet },
  { label: "Estoque baixo", path: "/estoque", icon: AlertTriangle },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return <div className="min-h-screen bg-[#f7f8f5]" />;
  }

  if (!user) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#f7f8f5] px-6">
        <section className="w-full max-w-md rounded-3xl border border-[#dfe4d9] bg-white p-8 text-center shadow-[0_16px_50px_rgba(32,45,28,0.08)]">
          <div className="mx-auto mb-6 grid size-12 place-items-center rounded-2xl bg-[#193c32] text-[#d7f0b5]">
            <Store className="size-6" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5b7163]">Mercearia PDV</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#15261f]">Acesse sua operação</h1>
          <p className="mt-3 text-sm leading-6 text-[#64736b]">Entre para gerenciar produtos, acompanhar o estoque e operar o caixa.</p>
          <Button onClick={() => startLogin()} className="mt-7 h-11 w-full rounded-xl bg-[#193c32] font-semibold hover:bg-[#245542]">
            Entrar no sistema
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#15261f]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-[#dfe4d9] bg-[#193c32] text-[#e9f3e3] transition-[width] duration-200 lg:flex lg:flex-col ${collapsed ? "w-[76px]" : "w-[250px]"}`}
      >
        <div className="flex h-[76px] items-center border-b border-white/10 px-4">
          <button
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            onClick={() => setCollapsed(value => !value)}
            className="grid size-10 shrink-0 place-items-center rounded-xl text-[#d9e8d1] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7db79]"
          >
            {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          </button>
          {!collapsed && (
            <div className="ml-2 overflow-hidden whitespace-nowrap">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b7db79]">Mercearia</p>
              <p className="text-base font-semibold tracking-tight">Gestão & Caixa</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-6" aria-label="Navegação principal">
          <p className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#98b8a6] ${collapsed ? "sr-only" : ""}`}>Operação</p>
          <div className="space-y-1.5">
            {navigation.map(item => {
              const active = location === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`group flex h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium transition ${active ? "bg-[#d7f0b5] text-[#153127] shadow-sm" : "text-[#d9e8d1] hover:bg-white/10"}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="size-[19px] shrink-0" />
                  {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-2"}`}>
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#315e4a] text-xs font-bold text-[#d7f0b5]">
              {(user.name ?? "O").slice(0, 1).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user.name ?? "Operador"}</p>
                <p className="truncate text-xs text-[#9eb8aa]">Sessão ativa</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={logout} title="Sair" className="grid size-8 place-items-center rounded-lg text-[#b9cdbf] hover:bg-white/10 hover:text-white">
                <LogOut className="size-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className={`min-h-screen pb-24 transition-[padding] duration-200 lg:pb-8 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[250px]"}`}>
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e1e6de] bg-[#f7f8f5]/90 px-5 backdrop-blur lg:px-9">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-[#193c32] text-[#d7f0b5]"><Store className="size-5" /></div>
            <div><p className="text-sm font-semibold">Mercearia PDV</p><p className="text-xs text-[#6b786e]">Operação</p></div>
          </div>
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[#193c32] text-[#d7f0b5] shadow-sm"><Store className="size-[17px]" /></div>
            <div><p className="text-sm font-bold tracking-tight text-[#193c32]">Mercearia PDV</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#728279]">Caixa · Estoque · Agilidade</p></div>
          </div>
          {location === "/pdv" ? <button onClick={() => window.dispatchEvent(new Event("pdv:manual-sync"))} className="inline-flex items-center rounded-xl bg-[#193c32] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#245542] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#193c32]"><RefreshCw className="mr-1.5 size-4"/><span className="hidden sm:inline">Sincronizar vendas</span><span className="sm:hidden">Sincronizar</span></button> : <button onClick={() => setLocation("/pdv")} className="rounded-xl bg-[#193c32] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#245542] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#193c32]"><span className="hidden sm:inline">Abrir caixa</span><span className="sm:hidden">Caixa</span></button>}
        </header>
        <div className="mx-auto w-full max-w-[1540px] px-4 py-5 sm:px-6 lg:px-9 lg:py-8">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[68px] items-center justify-around border-t border-[#dde4d9] bg-white/95 px-2 backdrop-blur lg:hidden" aria-label="Navegação móvel">
        {navigation.map(item => {
          const active = location === item.path;
          const Icon = item.icon;
          return (
            <button key={item.path} onClick={() => setLocation(item.path)} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-semibold ${active ? "text-[#1e583f]" : "text-[#7a897f]"}`}>
              <Icon className="size-5" />
              <span className="truncate">{item.label === "Visão geral" ? "Início" : item.label.replace("Ponto de ", "")}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
