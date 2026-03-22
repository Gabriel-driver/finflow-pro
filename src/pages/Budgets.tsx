import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { MonthSelector, useMonthNav } from "@/components/MonthSelector";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, CheckCircle2, TrendingDown } from "lucide-react";

export default function Budgets() {
  const { categories, getCategorySpending, settings, transactions } = useFinance();
  const { currentDate, monthKey, prevMonth, nextMonth } = useMonthNav();

  const expenseCats = categories.filter(c => c.type === "expense" && c.budgetLimit);
  const totalSpent = transactions.filter(t => t.type === "expense" && t.date.startsWith(monthKey)).reduce((s, t) => s + t.amount, 0);
  const budgetPct = settings.monthlyBudget > 0 ? (totalSpent / settings.monthlyBudget) * 100 : 0;

  const catData = expenseCats.map(cat => {
    const spent = getCategorySpending(cat.name, monthKey);
    const pct = cat.budgetLimit ? (spent / cat.budgetLimit!) * 100 : 0;
    return { ...cat, spent, pct, remaining: Math.max((cat.budgetLimit || 0) - spent, 0) };
  }).sort((a, b) => b.pct - a.pct);

  const chartData = catData.map(c => ({
    name: `${c.icon} ${c.name}`,
    gasto: c.spent,
    limite: c.budgetLimit || 0,
    fill: c.pct > 100 ? "hsl(0 72% 55%)" : c.pct > 80 ? "hsl(38 92% 55%)" : "hsl(var(--primary))",
  }));

  const overBudget = catData.filter(c => c.pct > 100);
  const nearBudget = catData.filter(c => c.pct >= 80 && c.pct <= 100);
  const okBudget = catData.filter(c => c.pct < 80);

  const tooltipStyle = { background: "hsl(240 5% 12%)", border: "1px solid hsl(240 4% 16%)", borderRadius: 8, color: "hsl(220 14% 92%)" };

  return (
    <AppLayout title="Orçamentos">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <MonthSelector currentDate={currentDate} onPrev={prevMonth} onNext={nextMonth} />
          <p className="text-muted-foreground text-sm">Controle seus limites por categoria</p>
        </div>

        {/* Global budget */}
        {settings.monthlyBudget > 0 && (
          <div className="glass-card rounded-xl p-6 animate-slide-up" style={{ animationFillMode: "backwards" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">Orçamento Geral</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(totalSpent)} de {formatCurrency(settings.monthlyBudget)}</p>
              </div>
              <span className={`text-2xl font-bold tabular-nums ${budgetPct > 100 ? "text-destructive" : budgetPct > 80 ? "text-warning" : "text-success"}`}>
                {budgetPct.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${budgetPct > 100 ? "bg-destructive" : budgetPct > 80 ? "bg-warning" : "bg-success"}`}
                style={{ width: `${Math.min(budgetPct, 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {budgetPct <= 100
                ? `Restam ${formatCurrency(settings.monthlyBudget - totalSpent)} este mês`
                : `Excedido em ${formatCurrency(totalSpent - settings.monthlyBudget)}`}
            </p>
          </div>
        )}

        {/* Status summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 animate-slide-up" style={{ animationDelay: "80ms", animationFillMode: "backwards" }}>
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-destructive" /><span className="text-sm font-medium">Estourados</span></div>
            <p className="text-2xl font-bold tabular-nums text-destructive">{overBudget.length}</p>
          </div>
          <div className="glass-card rounded-xl p-4 animate-slide-up" style={{ animationDelay: "160ms", animationFillMode: "backwards" }}>
            <div className="flex items-center gap-2 mb-2"><TrendingDown className="h-4 w-4 text-warning" /><span className="text-sm font-medium">Atenção</span></div>
            <p className="text-2xl font-bold tabular-nums text-warning">{nearBudget.length}</p>
          </div>
          <div className="glass-card rounded-xl p-4 animate-slide-up" style={{ animationDelay: "240ms", animationFillMode: "backwards" }}>
            <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="h-4 w-4 text-success" /><span className="text-sm font-medium">OK</span></div>
            <p className="text-2xl font-bold tabular-nums text-success">{okBudget.length}</p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "320ms", animationFillMode: "backwards" }}>
            <h3 className="font-semibold text-sm mb-4">Gasto vs Limite por Categoria</h3>
            <ResponsiveContainer width="100%" height={Math.max(catData.length * 50, 200)}>
              <BarChart data={chartData} layout="vertical" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
                <XAxis type="number" tick={{ fill: "hsl(220 8% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(220 8% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="limite" fill="hsl(240 4% 22%)" radius={[0, 4, 4, 0]} name="Limite" />
                <Bar dataKey="gasto" radius={[0, 4, 4, 0]} name="Gasto">
                  {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category details */}
        <div className="space-y-3">
          {catData.map((cat, i) => (
            <div key={cat.id} className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: `${400 + i * 60}ms`, animationFillMode: "backwards" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(cat.spent)} de {formatCurrency(cat.budgetLimit || 0)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold tabular-nums ${cat.pct > 100 ? "text-destructive" : cat.pct > 80 ? "text-warning" : "text-success"}`}>
                    {cat.pct.toFixed(0)}%
                  </span>
                  {cat.remaining > 0 && <p className="text-xs text-muted-foreground">Resta {formatCurrency(cat.remaining)}</p>}
                </div>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${cat.pct > 100 ? "bg-destructive" : cat.pct > 80 ? "bg-warning" : "bg-primary"}`}
                  style={{ width: `${Math.min(cat.pct, 100)}%` }} />
              </div>
            </div>
          ))}
          {catData.length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground text-sm animate-slide-up">
              Defina limites de orçamento nas suas categorias para acompanhar aqui
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
