import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { MonthSelector, useMonthNav } from "@/components/MonthSelector";
import { Plus, ArrowUpRight, ArrowDownRight, Search, Trash2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { NewTransactionModal } from "@/components/NewTransactionModal";

export default function Transactions() {
  const { transactions, accounts, deleteTransaction } = useFinance();
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { currentDate, monthKey, prevMonth, nextMonth } = useMonthNav();

  const monthTxs = transactions.filter(t => t.date.startsWith(monthKey));
  const sorted = [...monthTxs].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = sorted
    .filter(t => filter === "all" || t.type === filter)
    .filter(t => t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));

  const totalInc = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExp = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <AppLayout title="Transações">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <MonthSelector currentDate={currentDate} onPrev={prevMonth} onNext={nextMonth} />
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.97]">
            <Plus className="h-4 w-4" /> Nova Transação
          </button>
        </div>

        {/* Month summary mini */}
        <div className="flex gap-4 text-sm animate-slide-up" style={{ animationFillMode: "backwards" }}>
          <span className="text-success font-medium tabular-nums">↑ {formatCurrency(totalInc)}</span>
          <span className="text-destructive font-medium tabular-nums">↓ {formatCurrency(totalExp)}</span>
          <span className={`font-medium tabular-nums ${totalInc - totalExp >= 0 ? "text-success" : "text-destructive"}`}>
            = {formatCurrency(totalInc - totalExp)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar transações..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
          </div>
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            {(["all", "income", "expense"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {f === "all" ? "Todas" : f === "income" ? "Entradas" : "Saídas"}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Transação</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Conta</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Data</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => {
                  const account = accounts.find(a => a.id === tx.accountId);
                  return (
                    <tr key={tx.id} className="border-b border-border/20 hover:bg-muted/15 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === "income" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                            {tx.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{tx.description}</p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span>{tx.category}</span>
                              {tx.recurring && <RefreshCw className="h-3 w-3 text-primary" />}
                              {tx.installments && <span className="text-primary">({tx.currentInstallment}/{tx.installments})</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground hidden sm:table-cell">{account?.icon} {account?.name}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground hidden md:table-cell tabular-nums">{new Date(tx.date).toLocaleDateString("pt-BR")}</td>
                      <td className={`px-5 py-4 text-sm font-semibold text-right tabular-nums ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-3 py-4">
                        <button onClick={() => deleteTransaction(tx.id)} className="p-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">Nenhuma transação encontrada neste mês</div>}
        </div>
      </div>
      <NewTransactionModal open={modalOpen} onOpenChange={setModalOpen} />
    </AppLayout>
  );
}
