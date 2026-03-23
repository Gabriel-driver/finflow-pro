import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { StatCard } from "@/components/StatCard";
import { MonthSelector, useMonthNav } from "@/components/MonthSelector";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight, Sparkles, BrainCircuit, Target, Zap, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

export default function Dashboard() {
  const { accounts, transactions, getProjectedTransactions, getTotalBalance, getTotalIncome, getTotalExpenses, categories, getCategorySpending, goals, creditCards, settings } = useFinance();
  const { currentDate, monthKey, prevMonth, nextMonth } = useMonthNav();

  const totalBalance = getTotalBalance();
  const totalIncome = getTotalIncome(monthKey);
  const totalExpenses = getTotalExpenses(monthKey);
  const economy = totalIncome - totalExpenses;
  const budgetPct = settings.monthlyBudget > 0 ? (totalExpenses / settings.monthlyBudget) * 100 : 0;

  const projectedTransactions = getProjectedTransactions(monthKey);
  const allMonthlyTransactions = [
    ...transactions.filter(t => t.date.startsWith(monthKey)),
    ...projectedTransactions
  ];

  const recentTransactions = [...allMonthlyTransactions]
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

  // IA Insights Logic
  const getAIInsights = () => {
    const insights = [];
    const savingsRate = totalIncome > 0 ? (economy / totalIncome) * 100 : 0;
    const fixedExpenses = projectedTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const fixedPct = totalIncome > 0 ? (fixedExpenses / totalIncome) * 100 : 0;

    // Insight 1: Savings Rate
    if (savingsRate > 20) {
      insights.push({
        title: "Excelente taxa de poupança!",
        desc: `Você economizou ${savingsRate.toFixed(1)}% da sua renda este mês. Continue assim para atingir suas metas mais rápido.`,
        icon: Sparkles,
        color: "text-success",
        bg: "bg-success/10"
      });
    } else if (savingsRate > 0) {
      insights.push({
        title: "Bom progresso financeiro",
        desc: `Sua taxa de economia está em ${savingsRate.toFixed(1)}%. Tente chegar aos 20% para uma saúde financeira ideal.`,
        icon: TrendingUp,
        color: "text-primary",
        bg: "bg-primary/10"
      });
    } else if (totalIncome > 0) {
      insights.push({
        title: "Atenção ao fluxo de caixa",
        desc: "Suas despesas superaram suas receitas este mês. Revise seus gastos variáveis para equilibrar as contas.",
        icon: AlertCircle,
        color: "text-destructive",
        bg: "bg-destructive/10"
      });
    }

    // Insight 2: Fixed Costs
    if (fixedPct > 50) {
      insights.push({
        title: "Custos fixos elevados",
        desc: `Suas contas recorrentes consomem ${fixedPct.toFixed(0)}% da sua renda. Isso reduz sua margem de manobra financeira.`,
        icon: BrainCircuit,
        color: "text-warning",
        bg: "bg-warning/10"
      });
    }

    // Insight 3: Projections
    const nextMonthDate = new Date(currentDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonthKey = nextMonthDate.toISOString().slice(0, 7);
    const nextMonthFixed = getProjectedTransactions(nextMonthKey).filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    if (nextMonthFixed > 0) {
      insights.push({
        title: "Previsão para o próximo mês",
        desc: `Já identificamos ${formatCurrency(nextMonthFixed)} em despesas fixas para o próximo mês. Planeje-se!`,
        icon: Zap,
        color: "text-primary",
        bg: "bg-primary/10"
      });
    }

    return insights.slice(0, 3);
  };

  const aiInsights = getAIInsights();

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
          <MonthSelector currentDate={currentDate} prevMonth={prevMonth} nextMonth={nextMonth} />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
            <Sparkles className="h-3 w-3" />
            FinFlow AI Ativo
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Saldo Total" value={formatCurrency(totalBalance)} change="Todas as contas" changeType="neutral" icon={Wallet} delay={0} />
          <StatCard title="Entradas" value={formatCurrency(totalIncome)} change="Este mês" changeType="positive" icon={TrendingUp} delay={80} />
          <StatCard title="Saídas" value={formatCurrency(totalExpenses)} change="Este mês" changeType="negative" icon={TrendingDown} delay={160} />
          <StatCard title="Economia" value={formatCurrency(economy)} change={settings.monthlyBudget > 0 ? `Orçamento: ${budgetPct.toFixed(0)}%` : "Balanço do mês"} changeType={economy >= 0 ? "positive" : "negative"} icon={PiggyBank} delay={240} />
        </div>

        {/* AI Insights Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: "280ms", animationFillMode: "backwards" }}>
          {aiInsights.map((insight, i) => (
            <div key={i} className={`p-4 rounded-xl border border-border/40 ${insight.bg} flex gap-3 items-start`}>
              <div className={`p-2 rounded-lg ${insight.bg} ${insight.color} border border-current/10`}>
                <insight.icon className="h-4 w-4" />
              </div>
              <div>
                <h4 className={`text-sm font-bold ${insight.color}`}>{insight.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.desc}</p>
              </div>
            </div>
          ))}
          {aiInsights.length === 0 && (
            <div className="md:col-span-3 p-4 rounded-xl border border-dashed border-border/60 flex items-center justify-center text-muted-foreground text-xs">
              <BrainCircuit className="h-4 w-4 mr-2 opacity-50" />
              Adicione mais transações para que a IA possa gerar insights personalizados.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart */}
          <div className="lg:col-span-2 glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "320ms", animationFillMode: "backwards" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-sm">Fluxo de Caixa (6 meses)</h3>
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-success" /> Entradas</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-destructive" /> Saídas</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "hsl(220 8% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(220 8% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `R$ ${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted) / 0.2)'}}
                  contentStyle={tooltipStyle} 
                  formatter={(v: number) => formatCurrency(v)} 
                />
                <Bar dataKey="income" fill="hsl(152 60% 48%)" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="expense" fill="hsl(0 72% 55%)" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "400ms", animationFillMode: "backwards" }}>
            <h3 className="font-semibold text-sm mb-4">Distribuição de Gastos</h3>
            {categoryExpenses.length > 0 ? (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={categoryExpenses} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                        {categoryExpenses.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Total</span>
                    <span className="text-lg font-bold tabular-nums">{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
                <div className="space-y-2 mt-4 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                  {categoryExpenses.map(cat => (
                    <div key={cat.name} className="flex items-center justify-between text-xs group">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cat.fill }} />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">{cat.icon} {cat.name}</span>
                      </div>
                      <span className="font-medium tabular-nums">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[320px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/60 rounded-xl">
                <TrendingDown className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground">Nenhuma despesa registrada para este mês.</p>
              </div>
            )}
          </div>
        </div>

        {/* Middle Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "440ms", animationFillMode: "backwards" }}>
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Saúde Orçamentária</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Gastos vs Renda</span>
                  <span className="font-bold">{(totalExpenses / (totalIncome || 1) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${totalExpenses > totalIncome ? "bg-destructive" : "bg-primary"}`} style={{ width: `${Math.min((totalExpenses / (totalIncome || 1)) * 100, 100)}%` }} />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {totalExpenses > totalIncome 
                  ? "Você está gastando mais do que ganha. Recomenda-se reduzir gastos variáveis." 
                  : "Seu orçamento está saudável. Você tem margem para investimentos."}
              </p>
            </div>
          </div>

          {/* Balance evolution */}
          <div className="md:col-span-2 glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "460ms", animationFillMode: "backwards" }}>
            <h3 className="font-semibold text-sm mb-4">Evolução do Patrimônio</h3>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "hsl(220 8% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" name="Saldo Líquido" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent transactions */}
          <div className="lg:col-span-2 glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "520ms", animationFillMode: "backwards" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-sm">Fluxo Recente</h3>
              <a href="/transactions" className="text-xs text-primary hover:underline font-medium">Ver extrato completo</a>
            </div>
            <div className="space-y-1">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs border border-border/40 ${tx.type === "income" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {tx.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{tx.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                        <span>{tx.category}</span>
                        <span>•</span>
                        <span>{new Date(tx.date).toLocaleDateString("pt-BR", {day: '2-digit', month: 'short'})}</span>
                        {tx.description.includes("(Projetado)") && (
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1 text-[8px]">PREVISÃO</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`font-bold text-sm tabular-nums ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Zap className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
                </div>
              )}
            </div>
          </div>

          {/* Accounts & quick info */}
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "580ms", animationFillMode: "backwards" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Contas Ativas</h3>
                <a href="/accounts" className="p-1 rounded-md hover:bg-muted/50 transition-colors">
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
              <div className="space-y-3">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/20">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{acc.icon}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{acc.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{acc.type}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{formatCurrency(acc.balance)}</span>
                  </div>
                ))}
              </div>
            </div>

            {goals.length > 0 && (
              <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "640ms", animationFillMode: "backwards" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Metas de Longo Prazo</h3>
                  <a href="/goals" className="text-xs text-primary hover:underline">Ver todas</a>
                </div>
                <div className="space-y-4">
                  {goals.slice(0, 2).map(g => {
                    const pct = Math.min((g.current / g.target) * 100, 100);
                    return (
                      <div key={g.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🎯</span>
                            <span className="font-bold">{g.name}</span>
                          </div>
                          <span className="font-bold tabular-nums text-primary">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/20">
                          <div className={`h-full rounded-full transition-all duration-1000 ${pct >= 100 ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                          <span>{formatCurrency(g.current)}</span>
                          <span>{formatCurrency(g.target)}</span>
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
