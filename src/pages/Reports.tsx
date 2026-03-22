import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { MonthSelector, useMonthNav } from "@/components/MonthSelector";
import { Download, FileText, FileSpreadsheet, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { toast } from "sonner";

export default function Reports() {
  const { transactions, accounts, categories, creditCards, getCategorySpending, getTotalIncome, getTotalExpenses } = useFinance();
  const { currentDate, monthKey, prevMonth, nextMonth } = useMonthNav();

  const monthTxs = transactions.filter(t => t.date.startsWith(monthKey));
  const income = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

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
    const headers = "Data;Descrição;Categoria;Tipo;Valor;Conta\n";
    const rows = monthTxs.sort((a, b) => a.date.localeCompare(b.date)).map(t => {
      const acc = accounts.find(a => a.id === t.accountId);
      return `${new Date(t.date).toLocaleDateString("pt-BR")};"${t.description}";"${t.category}";${t.type === "income" ? "Entrada" : "Saída"};${t.amount.toFixed(2).replace(".", ",")};"${acc?.name || ""}"`;
    }).join("\n");

    const summary = `\n\nRESUMO\nTotal Entradas;${income.toFixed(2).replace(".", ",")}\nTotal Saídas;${expense.toFixed(2).replace(".", ",")}\nSaldo;${(income - expense).toFixed(2).replace(".", ",")}`;
    const blob = new Blob(["\uFEFF" + headers + rows + summary], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `extrato-${monthKey}.csv`);
    toast.success("Extrato CSV exportado!");
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
    html += `<h1>📊 Continhas da Duda</h1>`;
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

    html += `<div class="footer">Gerado em ${new Date().toLocaleString("pt-BR")} — Continhas da Duda</div></body></html>`;

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
    <AppLayout title="Relatórios">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <MonthSelector currentDate={currentDate} onPrev={prevMonth} onNext={nextMonth} />
          <div className="flex gap-2">
            <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2.5 bg-destructive/15 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/25 transition-colors active:scale-[0.97]">
              <FileText className="h-4 w-4" /> PDF
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-success/15 text-success rounded-lg text-sm font-medium hover:bg-success/25 transition-colors active:scale-[0.97]">
              <FileSpreadsheet className="h-4 w-4" /> CSV / Excel
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationFillMode: "backwards" }}>
            <p className="text-sm text-muted-foreground mb-1">Entradas</p>
            <p className="text-xl font-bold tabular-nums text-success">{formatCurrency(income)}</p>
            <p className="text-xs text-muted-foreground mt-1">{monthTxs.filter(t => t.type === "income").length} transações</p>
          </div>
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "80ms", animationFillMode: "backwards" }}>
            <p className="text-sm text-muted-foreground mb-1">Saídas</p>
            <p className="text-xl font-bold tabular-nums text-destructive">{formatCurrency(expense)}</p>
            <p className="text-xs text-muted-foreground mt-1">{monthTxs.filter(t => t.type === "expense").length} transações</p>
          </div>
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "160ms", animationFillMode: "backwards" }}>
            <p className="text-sm text-muted-foreground mb-1">Saldo do Mês</p>
            <p className={`text-xl font-bold tabular-nums ${income - expense >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(income - expense)}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "240ms", animationFillMode: "backwards" }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Evolução 12 Meses</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(220 8% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(220 8% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="income" fill="hsl(152 60% 48% / 0.15)" stroke="hsl(152 60% 48%)" name="Entradas" />
                <Area type="monotone" dataKey="expense" fill="hsl(0 72% 55% / 0.15)" stroke="hsl(0 72% 55%)" name="Saídas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "320ms", animationFillMode: "backwards" }}>
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Gastos por Categoria</h3>
            </div>
            {expenseCats.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={expenseCats} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {expenseCats.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {expenseCats.map(c => (
                    <div key={c.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: c.fill }} />
                        <span className="text-muted-foreground">{c.icon} {c.name}</span>
                      </div>
                      <span className="font-medium tabular-nums">{formatCurrency(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-sm text-muted-foreground">Sem dados neste mês</p>}
          </div>
        </div>

        {/* Saldo evolução */}
        <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "400ms", animationFillMode: "backwards" }}>
          <h3 className="font-semibold text-sm mb-4">📈 Evolução do Saldo Mensal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(220 8% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(220 8% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} name="Saldo" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction list - bank statement style */}
        <div className="glass-card rounded-xl overflow-hidden animate-slide-up" style={{ animationDelay: "480ms", animationFillMode: "backwards" }}>
          <div className="px-5 py-3 border-b border-border/30">
            <h3 className="font-semibold text-sm">📋 Extrato do Mês</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Categoria</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Conta</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody>
                {monthTxs.sort((a, b) => a.date.localeCompare(b.date)).map(tx => {
                  const acc = accounts.find(a => a.id === tx.accountId);
                  return (
                    <tr key={tx.id} className="border-b border-border/15 hover:bg-muted/15 transition-colors">
                      <td className="px-5 py-3 text-sm tabular-nums">{new Date(tx.date).toLocaleDateString("pt-BR")}</td>
                      <td className="px-5 py-3 text-sm">{tx.description}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground hidden sm:table-cell">{tx.category}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">{acc?.icon} {acc?.name}</td>
                      <td className={`px-5 py-3 text-sm font-semibold text-right tabular-nums ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {monthTxs.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">Nenhuma transação neste mês</div>}
        </div>
      </div>
    </AppLayout>
  );
}
