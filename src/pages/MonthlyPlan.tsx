import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { useState } from "react";
import { Calendar, TrendingUp, TrendingDown, PiggyBank, ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function MonthlyPlan() {
  const { transactions, categories, getCategorySpending, settings } = useFinance();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const monthIncome = transactions
    .filter(t => t.type === "income" && t.date.startsWith(monthKey))
    .reduce((s, t) => s + t.amount, 0);

  const monthExpense = transactions
    .filter(t => t.type === "expense" && t.date.startsWith(monthKey))
    .reduce((s, t) => s + t.amount, 0);

  const balance = monthIncome - monthExpense;
  const budgetPct = settings.monthlyBudget > 0 ? (monthExpense / settings.monthlyBudget) * 100 : 0;

  // Category breakdown
  const expenseCategories = categories.filter(c => c.type === "expense");
  const categoryData = expenseCategories.map(cat => ({
    name: `${cat.icon} ${cat.name}`,
    spent: getCategorySpending(cat.name, monthKey),
    limit: cat.budgetLimit || 0,
  })).filter(c => c.spent > 0 || c.limit > 0).sort((a, b) => b.spent - a.spent);

  // Recurring transactions this month
  const recurring = transactions.filter(t => t.recurring && t.date.startsWith(monthKey));

  // Upcoming installments
  const installments = transactions.filter(t => t.installments && t.currentInstallment && t.date.startsWith(monthKey));

  // Navigate months
  const prevMonth = () => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; });
  const nextMonth = () => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; });

  // Last 6 months data for chart
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const inc = transactions.filter(t => t.type === "income" && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === "expense" && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
    return { month: d.toLocaleDateString("pt-BR", { month: "short" }), income: inc, expense: exp };
  });

  return (
    <AppLayout title="Planejamento Mensal">
      <div className="space-y-6">
        {/* Month navigator */}
        <div className="flex items-center justify-center gap-4 animate-fade-in">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="h-5 w-5" /></button>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
          </div>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"><ChevronRight className="h-5 w-5" /></button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationFillMode: "backwards" }}>
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-success" /><span className="text-sm text-muted-foreground">Entradas</span></div>
            <p className="text-xl font-bold tabular-nums text-success">{formatCurrency(monthIncome)}</p>
          </div>
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "80ms", animationFillMode: "backwards" }}>
            <div className="flex items-center gap-2 mb-2"><TrendingDown className="h-4 w-4 text-destructive" /><span className="text-sm text-muted-foreground">Saídas</span></div>
            <p className="text-xl font-bold tabular-nums text-destructive">{formatCurrency(monthExpense)}</p>
          </div>
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "160ms", animationFillMode: "backwards" }}>
            <div className="flex items-center gap-2 mb-2"><PiggyBank className="h-4 w-4 text-primary" /><span className="text-sm text-muted-foreground">Saldo</span></div>
            <p className={`text-xl font-bold tabular-nums ${balance >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(balance)}</p>
          </div>
        </div>

        {/* Budget progress */}
        {settings.monthlyBudget > 0 && (
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Orçamento mensal</span>
              <span className={`text-sm font-bold tabular-nums ${budgetPct > 100 ? "text-destructive" : budgetPct > 80 ? "text-warning" : "text-success"}`}>
                {budgetPct.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${budgetPct > 100 ? "bg-destructive" : budgetPct > 80 ? "bg-warning" : "bg-success"}`}
                style={{ width: `${Math.min(budgetPct, 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{formatCurrency(monthExpense)} de {formatCurrency(settings.monthlyBudget)}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category breakdown */}
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "280ms", animationFillMode: "backwards" }}>
            <h3 className="font-semibold mb-4">Gastos por Categoria</h3>
            <div className="space-y-3">
              {categoryData.map(cat => {
                const pct = cat.limit > 0 ? (cat.spent / cat.limit) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{cat.name}</span>
                      <span className="tabular-nums font-medium">
                        {formatCurrency(cat.spent)}
                        {cat.limit > 0 && <span className="text-muted-foreground"> / {formatCurrency(cat.limit)}</span>}
                      </span>
                    </div>
                    {cat.limit > 0 && (
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct > 100 ? "bg-destructive" : pct > 80 ? "bg-warning" : "bg-primary"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
              {categoryData.length === 0 && <p className="text-sm text-muted-foreground">Nenhum gasto neste mês</p>}
            </div>
          </div>

          {/* Chart */}
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "360ms", animationFillMode: "backwards" }}>
            <h3 className="font-semibold mb-4">Evolução (6 meses)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(220 8% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(220 8% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(240 5% 12%)", border: "1px solid hsl(240 4% 16%)", borderRadius: 8, color: "hsl(220 14% 92%)" }}
                  formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="income" fill="hsl(152 60% 48%)" radius={[4, 4, 0, 0]} name="Entradas" />
                <Bar dataKey="expense" fill="hsl(0 72% 55%)" radius={[4, 4, 0, 0]} name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recurring & Installments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "440ms", animationFillMode: "backwards" }}>
            <h3 className="font-semibold mb-4">🔄 Recorrentes</h3>
            {recurring.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma transação recorrente este mês</p>
            ) : (
              <div className="space-y-2">
                {recurring.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">Dia {tx.recurringDay} • {tx.category}</p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "520ms", animationFillMode: "backwards" }}>
            <h3 className="font-semibold mb-4">📋 Parcelas</h3>
            {installments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma parcela neste mês</p>
            ) : (
              <div className="space-y-2">
                {installments.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">Parcela {tx.currentInstallment}/{tx.installments}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-destructive">-{formatCurrency(tx.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
