import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { MonthSelector, useMonthNav } from "@/components/MonthSelector";
import { Download, FileText, FileSpreadsheet, BarChart3, PieChart as PieChartIcon, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { toast } from "sonner";

export default function Reports() {
  const { transactions, getProjectedTransactions, accounts, categories, creditCards, getCategorySpending, getTotalIncome, getTotalExpenses, settings } = useFinance();
  const { currentDate, monthKey, prevMonth, nextMonth } = useMonthNav();

  const systemName = settings.systemName || "FinFlow Pro";

  const projectedTxs = getProjectedTransactions(monthKey);
  const monthTxs = [
    ...transactions.filter(t => t.date.startsWith(monthKey)),
    ...projectedTxs
  ];
  
  const income = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const catColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--warning))"];
  const expenseCats = categories.filter(c => c.type === "expense").map((cat, i) => ({
    name: cat.name, icon: cat.icon,
    value: getCategorySpending(cat.name, monthKey),
    fill: catColors[i % catColors.length],
  })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

  // 12-month evolution
  const evolutionData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - (11 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      month: d.toLocaleDateString("pt-BR", { month: "short" }),
      income: getTotalIncome(key),
      expense: getTotalExpenses(key),
      balance: getTotalIncome(key) - getTotalExpenses(key),
    };
  });

  const tooltipStyle = { background: "hsl(240 5% 12%)", border: "1px solid hsl(240 4% 16%)", borderRadius: 8, color: "hsl(220 14% 92%)" };

  const exportCSV = () => {
    const headers = "Data;Descrição;Categoria;Tipo;Valor;Origem\n";
    const rows = monthTxs.sort((a, b) => a.date.localeCompare(b.date)).map(t => {
      const acc = accounts.find(a => a.id === t.accountId);
      const card = creditCards.find(c => c.id === t.creditCardId);
      const origin = acc ? acc.name : (card ? `Cartão: ${card.name}` : "");
      return `${new Date(t.date).toLocaleDateString("pt-BR")};"${t.description}";"${t.category}";${t.type === "income" ? "Entrada" : "Saída"};${t.amount.toFixed(2).replace(".", ",")};"${origin}"`;
    }).join("\n");

    const summary = `\n\nRESUMO\nTotal Entradas;${income.toFixed(2).replace(".", ",")}\nTotal Saídas;${expense.toFixed(2).replace(".", ",")}\nSaldo;${(income - expense).toFixed(2).replace(".", ",")}`;
    const blob = new Blob(["\uFEFF" + headers + rows + summary], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `extrato-${monthKey}.csv`);
    toast.success("Extrato exportado com sucesso!");
  };

  const exportPDF = () => {
    const monthLabel = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    let html = `<html><head><style>
      body{font-family:Arial,sans-serif;padding:40px;color:#222;max-width:800px;margin:0 auto}
      h1{color:#6c3fcf;border-bottom:3px solid #6c3fcf;padding-bottom:8px}
      h2{color:#444;margin-top:24px}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th{background:#6c3fcf;color:#fff;padding:10px;text-align:left;font-size:13px}
      td{padding:8px 10px;border-bottom:1px solid #eee;font-size:13px}
      tr:nth-child(even){background:#f9f9f9}
      .income{color:#2ecc71} .expense{color:#e74c3c}
      .summary{background:#f4f0ff;border-radius:8px;padding:16px;margin-top:20px;display:flex;gap:40px}
      .summary div{text-align:center}
      .summary .label{font-size:12px;color:#888} .summary .val{font-size:20px;font-weight:bold}
      .footer{text-align:center;margin-top:40px;color:#aaa;font-size:11px}
    </style></head><body>`;
    html += `<h1>📊 ${systemName}</h1>`;
    html += `<h2>Extrato — ${monthLabel}</h2>`;
    html += `<div class="summary">
      <div><div class="label">Entradas</div><div class="val income">R$ ${income.toFixed(2).replace(".", ",")}</div></div>
      <div><div class="label">Saídas</div><div class="val expense">R$ ${expense.toFixed(2).replace(".", ",")}</div></div>
      <div><div class="label">Saldo</div><div class="val" style="color:${income - expense >= 0 ? '#2ecc71' : '#e74c3c'}">R$ ${(income - expense).toFixed(2).replace(".", ",")}</div></div>
    </div>`;
    html += `<table><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th>Conta</th></tr>`;
    monthTxs.sort((a, b) => a.date.localeCompare(b.date)).forEach(t => {
      const acc = accounts.find(a => a.id === t.accountId);
      const cls = t.type === "income" ? "income" : "expense";
      html += `<tr><td>${new Date(t.date).toLocaleDateString("pt-BR")}</td><td>${t.description}</td><td>${t.category}</td><td class="${cls}">${t.type === "income" ? "Entrada" : "Saída"}</td><td class="${cls}">R$ ${t.amount.toFixed(2).replace(".", ",")}</td><td>${acc?.name || ""}</td></tr>`;
    });
    html += `</table>`;

    if (expenseCats.length > 0) {
      html += `<h2>Gastos por Categoria</h2><table><tr><th>Categoria</th><th>Valor</th><th>%</th></tr>`;
      expenseCats.forEach(c => {
        html += `<tr><td>${c.icon} ${c.name}</td><td>R$ ${c.value.toFixed(2).replace(".", ",")}</td><td>${((c.value / expense) * 100).toFixed(1)}%</td></tr>`;
      });
      html += `</table>`;
    }

    html += `<div class="footer">Gerado em ${new Date().toLocaleString("pt-BR")} — ${systemName}</div></body></html>`;

    const blob = new Blob([html], { type: "application/pdf" });
    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      setTimeout(() => printWin.print(), 500);
    }
    toast.success("Relatório pronto para impressão/PDF!");
  };

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppLayout title="Relatórios Analíticos">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <MonthSelector currentDate={currentDate} prevMonth={prevMonth} nextMonth={nextMonth} />
          <div className="flex gap-2">
            <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2.5 bg-destructive/10 text-destructive rounded-xl text-sm font-bold hover:bg-destructive/20 transition-all active:scale-[0.97] border border-destructive/20">
              <FileText className="h-4 w-4" /> PDF
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-success/10 text-success rounded-xl text-sm font-bold hover:bg-success/20 transition-all active:scale-[0.97] border border-success/20">
              <FileSpreadsheet className="h-4 w-4" /> EXCEL
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border-l-4 border-l-success relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-12 w-12 text-success" />
            </div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Entradas</p>
            <p className="text-2xl font-black text-success tabular-nums">{formatCurrency(income)}</p>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {monthTxs.filter(t => t.type === "income").length} registros
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border-l-4 border-l-destructive relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingDown className="h-12 w-12 text-destructive" />
            </div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Saídas</p>
            <p className="text-2xl font-black text-destructive tabular-nums">{formatCurrency(expense)}</p>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {monthTxs.filter(t => t.type === "expense").length} registros
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border-l-4 border-l-primary relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-12 w-12 text-primary" />
            </div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Resultado</p>
            <p className={`text-2xl font-black tabular-nums ${balance >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(balance)}</p>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">
              Margem: {income > 0 ? ((balance / income) * 100).toFixed(1) : 0}%
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border-l-4 border-l-warning relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <Info className="h-12 w-12 text-warning" />
            </div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Taxa de Poupança</p>
            <p className="text-2xl font-black text-warning tabular-nums">
              {income > 0 ? Math.max(0, (balance / income) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">Meta sugerida: 20%</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "240ms", animationFillMode: "backwards" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-sm uppercase tracking-tight flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Histórico Anual
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="reportIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152 60% 48%)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(152 60% 48%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="reportExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0 72% 55%)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(0 72% 55%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "hsl(220 8% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(220 8% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$ ${v/1000}k`} />
                <Tooltip 
                  contentStyle={tooltipStyle} 
                  cursor={{stroke: 'hsl(var(--primary) / 0.2)', strokeWidth: 2}}
                  formatter={(v: number) => formatCurrency(v)} 
                />
                <Area type="monotone" dataKey="income" stroke="hsl(152 60% 48%)" strokeWidth={3} fillOpacity={1} fill="url(#reportIncome)" name="Receitas" />
                <Area type="monotone" dataKey="expense" stroke="hsl(0 72% 55%)" strokeWidth={3} fillOpacity={1} fill="url(#reportExpense)" name="Despesas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "320ms", animationFillMode: "backwards" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-sm uppercase tracking-tight flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" /> Raio-X de Gastos
              </h3>
            </div>
            {expenseCats.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2 h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseCats} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                        {expenseCats.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-3 max-h-[220px] overflow-y-auto pr-4 custom-scrollbar">
                  {expenseCats.map(c => (
                    <div key={c.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: c.fill }} />
                          {c.icon} {c.name}
                        </span>
                        <span className="font-black tabular-nums">{((c.value / expense) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ background: c.fill, width: `${(c.value / expense) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border/40 rounded-xl">
                Nenhuma despesa para analisar.
              </div>
            )}
          </div>
        </div>

        {/* Transaction list - bank statement style */}
        <div className="glass-card rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: "480ms", animationFillMode: "backwards" }}>
          <div className="px-6 py-4 border-b border-border/30 bg-muted/20 flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" /> Detalhamento Mensal
            </h3>
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded uppercase tracking-tighter">
              {monthTxs.length} transações encontradas
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/40 bg-muted/10">
                  <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data</th>
                  <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Descrição</th>
                  <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Categoria</th>
                  <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden md:table-cell">Origem</th>
                  <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {monthTxs.sort((a, b) => a.date.localeCompare(b.date)).map(tx => {
                  const acc = accounts.find(a => a.id === tx.accountId);
                  const card = creditCards.find(c => c.id === tx.creditCardId);
                  return (
                    <tr key={tx.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4 text-sm tabular-nums font-medium text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString("pt-BR", {day: '2-digit', month: '2-digit'})}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold flex items-center gap-2">
                          {tx.description}
                          {tx.description.includes("(Projetado)") && (
                            <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black uppercase">Fixo</span>
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-xs font-bold text-muted-foreground bg-muted/30 px-2 py-1 rounded-lg">
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          {acc ? (<span>{acc.icon} {acc.name}</span>) : card ? (<span>💳 {card.name}</span>) : "-"}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm font-black text-right tabular-nums ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {monthTxs.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center text-center opacity-40">
              <Calendar className="h-12 w-12 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">Nenhum registro no período</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
