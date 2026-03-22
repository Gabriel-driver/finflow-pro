import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { MonthSelector, useMonthNav } from "@/components/MonthSelector";
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Eye } from "lucide-react";
import { useState } from "react";
import { NewAccountModal } from "@/components/NewAccountModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Accounts() {
  const { accounts, transactions, deleteAccount, getTotalIncome, getTotalExpenses } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const { currentDate, monthKey, prevMonth, nextMonth } = useMonthNav();

  const detailAccount = accounts.find(a => a.id === detailId);
  const detailTxs = detailId ? transactions.filter(t => t.accountId === detailId && t.date.startsWith(monthKey)).sort((a, b) => b.date.localeCompare(a.date)) : [];

  return (
    <AppLayout title="Contas">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <MonthSelector currentDate={currentDate} onPrev={prevMonth} onNext={nextMonth} />
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.97]">
            <Plus className="h-4 w-4" /> Nova Conta
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc, i) => {
            const monthInc = transactions.filter(t => t.accountId === acc.id && t.type === "income" && t.date.startsWith(monthKey)).reduce((s, t) => s + t.amount, 0);
            const monthExp = transactions.filter(t => t.accountId === acc.id && t.type === "expense" && t.date.startsWith(monthKey)).reduce((s, t) => s + t.amount, 0);

            return (
              <div key={acc.id} className="glass-card-hover rounded-xl p-5 animate-slide-up group" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{acc.icon}</span>
                    <div>
                      <span className="font-semibold">{acc.name}</span>
                      <p className="text-xs text-muted-foreground capitalize">{acc.type === "checking" ? "Corrente" : acc.type === "savings" ? "Poupança" : acc.type === "wallet" ? "Carteira" : "Cartão"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setDetailId(acc.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteAccount(acc.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(acc.balance)}</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">Saldo atual</p>
                <div className="flex gap-4 pt-3 border-t border-border/30">
                  <div className="flex items-center gap-1.5">
                    <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                    <span className="text-xs text-success font-medium tabular-nums">{formatCurrency(monthInc)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs text-destructive font-medium tabular-nums">{formatCurrency(monthExp)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div onClick={() => setModalOpen(true)} className="border-2 border-dashed border-border/50 rounded-xl p-5 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer min-h-[180px] animate-slide-up"
            style={{ animationDelay: `${accounts.length * 80}ms`, animationFillMode: "backwards" }}>
            <Plus className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Adicionar Conta</span>
          </div>
        </div>
      </div>

      <NewAccountModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Detail modal */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="bg-card border-border/50 max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{detailAccount?.icon}</span> {detailAccount?.name} — Extrato
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-3">
            {currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </p>
          {detailTxs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma transação neste mês</p>
          ) : (
            <div className="space-y-1">
              {detailTxs.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.category} • {new Date(tx.date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
