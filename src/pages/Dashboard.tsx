import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { StatCard } from "@/components/StatCard";
import { MonthSelector, useMonthNav } from "@/components/MonthSelector";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

export default function Dashboard() {
  const { accounts, transactions, getTotalBalance, getTotalIncome, getTotalExpenses, categories, getCategorySpending, goals, creditCards, settings } = useFinance();
  const { currentDate, monthKey, prevMonth, nextMonth } = useMonthNav();

  const totalBalance = getTotalBalance();
  const totalIncome = getTotalIncome(monthKey);
  const totalExpenses = getTotalExpenses(monthKey);
  const economy = totalIncome - totalExpenses;
  const budgetPct = settings.monthlyBudget > 0 ? (totalExpenses / settings.monthlyBudget) * 100 : 0;

  const recentTransactions = [...transactions]
    .filter(t => t.date.startsWith(monthKey))
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  // 6 months chart
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      month: d.toLocaleDateString("pt-BR", { month: "short" }),
      income: getTotalIncome(key),
      expense: getTotalExpenses(key),
      balance: getTotalIncome(key) - getTotalExpenses(key),
    };
  });

  // Category expenses
  const catColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
  const categoryExpenses = categories.filter(c => c.type === "expense").map((cat, i) => ({
    name: cat.name, icon: cat.icon,
    value: getCategorySpending(cat.name, monthKey),
    fill: catColors[i % catColors.length],
  })).filter(c => c.value > 0);

  const tooltipStyle = { background: "hsl(240 5% 12%)", border: "1px solid hsl(240 4% 16%)", borderRadius: 8, color: "hsl(220 14% 92%)" };

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <MonthSelector currentDate={currentDate} onPrev={prevMonth} onNext={nextMonth} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Saldo Total" value={formatCurrency(totalBalance)} change="Todas as contas" changeType="neutral" icon={Wallet} delay={0} />
          <StatCard title="Entradas" value={formatCurrency(totalIncome)} change="Este mês" changeType="positive" icon={TrendingUp} delay={80} />
          <StatCard title="Saídas" value={formatCurrency(totalExpenses)} change="Este mês" changeType="negative" icon={TrendingDown} delay={160} />
          <StatCard title="Economia" value={formatCurrency(economy)} change={settings.monthlyBudget > 0 ? `Orçamento: ${budgetPct.toFixed(0)}%` : "Balanço do mês"} changeType={economy >= 0 ? "positive" : "negative"} icon={PiggyBank} delay={240} />
        </div>

        {/* Budget bar */}
        {settings.monthlyBudget > 0 && (
          <div className="glass-card rounded-xl p-4 animate-slide-up" style={{ animationDelay: "280ms", animationFillMode: "backwards" }}>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Orçamento mensal</span>
              <span className={`text-xs font-bold tabular-nums ${budgetPct > 100 ? "text-destructive" : budgetPct > 80 ? "text-warning" : "text-success"}`}>
                {formatCurrency(totalExpenses)} / {formatCurrency(settings.monthlyBudget)}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${budgetPct > 100 ? "bg-destructive" : budgetPct > 80 ? "bg-warning" : "bg-success"}`}
                style={{ width: `${Math.min(budgetPct, 100)}%` }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart */}
          <div className="lg:col-span-2 glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "320ms", animationFillMode: "backwards" }}>
            <h3 className="font-semibold text-sm mb-4">Entradas vs Saídas</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(220 8% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(220 8% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="income" fill="hsl(152 60% 48%)" radius={[4, 4, 0, 0]} name="Entradas" />
                <Bar dataKey="expense" fill="hsl(0 72% 55%)" radius={[4, 4, 0, 0]} name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "400ms", animationFillMode: "backwards" }}>
            <h3 className="font-semibold text-sm mb-4">Gastos por Categoria</h3>
            {categoryExpenses.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryExpenses} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                      {categoryExpenses.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {categoryExpenses.map(cat => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: cat.fill }} />
                        <span className="text-muted-foreground">{cat.icon} {cat.name}</span>
                      </div>
                      <span className="font-medium tabular-nums">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-sm text-muted-foreground">Nenhuma despesa neste mês</p>}
          </div>
        </div>

        {/* Balance evolution */}
        <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "460ms", animationFillMode: "backwards" }}>
          <h3 className="font-semibold text-sm mb-4">📈 Evolução do Saldo</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(220 8% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(220 8% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="balance" fill="hsl(250 85% 65% / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} name="Saldo" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent transactions */}
          <div className="lg:col-span-2 glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "520ms", animationFillMode: "backwards" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Transações do Mês</h3>
              <a href="/transactions" className="text-xs text-primary hover:underline">Ver todas</a>
            </div>
            <div className="space-y-2">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs ${tx.type === "income" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                      {tx.type === "income" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.category} • {new Date(tx.date).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm tabular-nums ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
              {recentTransactions.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma transação neste mês</p>}
            </div>
          </div>

          {/* Accounts & quick info */}
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "580ms", animationFillMode: "backwards" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Contas</h3>
                <a href="/accounts" className="text-xs text-primary hover:underline">Ver</a>
              </div>
              <div className="space-y-2.5">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{acc.icon}</span>
                      <span className="text-sm font-medium">{acc.name}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(acc.balance)}</span>
                  </div>
                ))}
              </div>
            </div>

            {goals.length > 0 && (
              <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "640ms", animationFillMode: "backwards" }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Metas</h3>
                  <a href="/goals" className="text-xs text-primary hover:underline">Ver</a>
                </div>
                <div className="space-y-3">
                  {goals.slice(0, 3).map(g => {
                    const pct = Math.min((g.current / g.target) * 100, 100);
                    return (
                      <div key={g.id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>{g.icon} {g.name}</span>
                          <span className="font-medium tabular-nums">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 100 ? "bg-success" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
