import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { useEffect, useState } from "react";
import { Save, User, Bell, Palette, Shield, Download, Trash2, Globe, DollarSign, Moon } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { settings, updateSettings, transactions, accounts, categories, creditCards, goals } = useFinance();
  const [form, setForm] = useState(settings);

  // Keep local form in sync with freshly fetched settings
  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(form);
    toast.success("Configurações salvas com sucesso!");
  };

  const exportCSV = () => {
    const headers = "Data;Descrição;Categoria;Tipo;Valor;Conta\n";
    const rows = transactions.map(t => {
      const acc = accounts.find(a => a.id === t.accountId);
      return `${new Date(t.date).toLocaleDateString("pt-BR")};"${t.description}";"${t.category}";${t.type === "income" ? "Entrada" : "Saída"};${t.amount.toFixed(2).replace(".", ",")};"${acc?.name || ""}"`;
    }).join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `continhas-da-duda-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo CSV exportado!");
  };

  const exportJSON = () => {
    const data = { accounts, transactions, categories, creditCards, goals, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `backup-continhas-${new Date().toISOString().split("T")[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup JSON exportado!");
  };

  const inputClass = "w-full px-4 py-3 bg-muted/40 border border-border/40 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  const sections = [
    {
      icon: User, color: "primary", title: "Perfil", delay: 0,
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Nome</label>
            <input value={form.userName} onChange={e => setForm({ ...form, userName: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Nome do Sistema</label>
            <input value={form.systemName || ""} onChange={e => setForm({ ...form, systemName: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </div>
        </div>
      ),
    },
    {
      icon: Globe, color: "accent", title: "Preferências", delay: 100,
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Moeda</label>
            <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className={inputClass}>
              <option value="BRL">R$ — Real Brasileiro</option>
              <option value="USD">$ — Dólar</option>
              <option value="EUR">€ — Euro</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Idioma</label>
            <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className={inputClass}>
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      icon: Bell, color: "warning", title: "Notificações", delay: 200,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Ativar notificações</p>
              <p className="text-xs text-muted-foreground">Alertas de vencimentos e orçamento</p>
            </div>
            <button onClick={() => setForm({ ...form, notificationsEnabled: !form.notificationsEnabled })}
              className={`w-12 h-7 rounded-full transition-all duration-200 relative ${form.notificationsEnabled ? "bg-primary" : "bg-muted"}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${form.notificationsEnabled ? "left-6" : "left-1"}`} />
            </button>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Alertar com antecedência (dias)</label>
            <input type="number" min="1" max="15" value={form.alertDaysBefore}
              onChange={e => setForm({ ...form, alertDaysBefore: parseInt(e.target.value) || 3 })} className={inputClass} />
          </div>
        </div>
      ),
    },
    {
      icon: DollarSign, color: "success", title: "Orçamento", delay: 300,
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Limite mensal de gastos</label>
            <input type="number" step="100" value={form.monthlyBudget}
              onChange={e => setForm({ ...form, monthlyBudget: parseFloat(e.target.value) || 0 })} className={inputClass} />
            <p className="text-xs text-muted-foreground mt-1.5">Alerta ao atingir 80% desse valor</p>
          </div>
        </div>
      ),
    },
    {
      icon: Download, color: "accent", title: "Dados & Backup", delay: 400,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Exporte seus dados para manter um backup ou analisar fora do app</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-success/15 text-success rounded-lg text-sm font-medium hover:bg-success/25 transition-colors active:scale-[0.97]">
              <Download className="h-4 w-4" /> Exportar CSV
            </button>
            <button onClick={exportJSON} className="flex items-center gap-2 px-4 py-2.5 bg-accent/15 text-accent rounded-lg text-sm font-medium hover:bg-accent/25 transition-colors active:scale-[0.97]">
              <Download className="h-4 w-4" /> Backup JSON
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-destructive/15 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/25 transition-colors active:scale-[0.97]">
              <Trash2 className="h-4 w-4" /> Limpar Dados
            </button>
          </div>
        </div>
      ),
    },
    {
      icon: Shield, color: "destructive", title: "Segurança", delay: 500,
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Nova Senha</label>
            <input type="password" placeholder="••••••••" className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Confirmar Senha</label>
            <input type="password" placeholder="••••••••" className={inputClass} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <AppLayout title="Configurações">
      <div className="max-w-2xl space-y-6">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <section key={s.title} className="glass-card rounded-xl p-6 animate-slide-up" style={{ animationDelay: `${s.delay}ms`, animationFillMode: "backwards" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-lg bg-${s.color}/15 flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 text-${s.color}`} />
                </div>
                <h2 className="font-semibold">{s.title}</h2>
              </div>
              {s.content}
            </section>
          );
        })}

        <button onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all active:scale-[0.97] glow-primary animate-slide-up"
          style={{ animationDelay: "600ms", animationFillMode: "backwards" }}>
          <Save className="h-4 w-4" /> Salvar Configurações
        </button>
      </div>
    </AppLayout>
  );
}
